// lib/admin-auth.ts

import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface AdminSession {
  id: string;
  admin_id: string;
  token: string;
  expires_at: string;
}

// ========================================
// ADMIN AUTHENTICATION
// ========================================

/**
 * Admin login - separate from regular user login
 */
export async function adminLogin(email: string, password: string): Promise<{
  admin: AdminUser;
  token: string;
  expiresAt: Date;
}> {
  // 1. Find admin by email
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (adminError || !admin) {
    throw new Error('Invalid credentials');
  }

  // 2. Verify password
  const isValidPassword = await bcrypt.compare(password, admin.password_hash);
  
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // 3. Generate session token
  const token = generateAdminToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // 4. Create session
  const { error: sessionError } = await supabase
    .from('admin_sessions')
    .insert({
      admin_id: admin.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

  if (sessionError) {
    throw new Error('Failed to create session');
  }

  // 5. Update last login
  await supabase.rpc('update_admin_last_login', { admin_uuid: admin.id });

  // 6. Log activity
  await logAdminActivity(admin.id, admin.email, 'LOGIN');

  // 7. Remove password hash from response
  const { password_hash, ...adminWithoutPassword } = admin;

  return {
    admin: adminWithoutPassword as AdminUser,
    token,
    expiresAt,
  };
}

/**
 * Verify admin session token
 */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  // 1. Find valid session
  const { data: session, error: sessionError } = await supabase
    .from('admin_sessions')
    .select('*, admin_users(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (sessionError || !session) {
    return null;
  }

  // 2. Check if admin is still active
  const admin = session.admin_users;
  if (!admin || !admin.is_active) {
    return null;
  }

  // 3. Remove password hash
  const { password_hash, ...adminWithoutPassword } = admin;

  return adminWithoutPassword as AdminUser;
}

/**
 * Admin logout
 */
export async function adminLogout(token: string): Promise<void> {
  // Get admin info before deleting session for logging
  const admin = await verifyAdminToken(token);

  // Delete session
  await supabase
    .from('admin_sessions')
    .delete()
    .eq('token', token);

  // Log activity
  if (admin) {
    await logAdminActivity(admin.id, admin.email, 'LOGOUT');
  }
}

/**
 * Create new admin user (super_admin only)
 */
export async function createAdminUser(data: {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'super_admin';
}, createdBy: AdminUser): Promise<AdminUser> {
  // Only super_admins can create new admins
  if (createdBy.role !== 'super_admin') {
    throw new Error('Insufficient permissions');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create admin
  const { data: newAdmin, error } = await supabase
    .from('admin_users')
    .insert({
      email: data.email,
      password_hash: passwordHash,
      name: data.name,
      role: data.role,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Log activity
  await logAdminActivity(
    createdBy.id,
    createdBy.email,
    'CREATE_ADMIN',
    'admin_user',
    newAdmin.id,
    { created_email: data.email, created_role: data.role }
  );

  const { password_hash, ...adminWithoutPassword } = newAdmin;
  return adminWithoutPassword as AdminUser;
}

/**
 * Update admin password
 */
export async function updateAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Get admin
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', adminId)
    .single();

  if (error || !admin) {
    throw new Error('Admin not found');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid current password');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  const { error: updateError } = await supabase
    .from('admin_users')
    .update({
      password_hash: newPasswordHash,
      updated_at: new Date().toISOString(),
    })
    .eq('id', adminId);

  if (updateError) {
    throw new Error('Failed to update password');
  }

  // Log activity
  await logAdminActivity(adminId, admin.email, 'PASSWORD_CHANGE');

  // Invalidate all sessions for this admin
  await supabase
    .from('admin_sessions')
    .delete()
    .eq('admin_id', adminId);
}

/**
 * Deactivate admin user
 */
export async function deactivateAdmin(
  adminId: string,
  deactivatedBy: AdminUser
): Promise<void> {
  // Only super_admins can deactivate
  if (deactivatedBy.role !== 'super_admin') {
    throw new Error('Insufficient permissions');
  }

  // Cannot deactivate yourself
  if (adminId === deactivatedBy.id) {
    throw new Error('Cannot deactivate yourself');
  }

  const { data: admin } = await supabase
    .from('admin_users')
    .select('email')
    .eq('id', adminId)
    .single();

  // Deactivate
  await supabase
    .from('admin_users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', adminId);

  // Delete all sessions
  await supabase
    .from('admin_sessions')
    .delete()
    .eq('admin_id', adminId);

  // Log activity
  await logAdminActivity(
    deactivatedBy.id,
    deactivatedBy.email,
    'DEACTIVATE_ADMIN',
    'admin_user',
    adminId,
    { deactivated_email: admin?.email }
  );
}

// ========================================
// ADMIN ACTIVITY LOGGING
// ========================================

export async function logAdminActivity(
  adminId: string,
  adminEmail: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any
): Promise<void> {
  await supabase.rpc('log_admin_activity', {
    p_admin_id: adminId,
    p_admin_email: adminEmail,
    p_action: action,
    p_resource_type: resourceType || null,
    p_resource_id: resourceId || null,
    p_details: details ? JSON.stringify(details) : null,
  });
}

/**
 * Get admin activity logs
 */
export async function getAdminActivityLogs(options?: {
  adminId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('admin_activity_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.adminId) {
    query = query.eq('admin_id', options.adminId);
  }

  if (options?.action) {
    query = query.eq('action', options.action);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function generateAdminToken(): string {
  return uuidv4() + '-' + Date.now() + '-' + Math.random().toString(36);
}

/**
 * Cleanup expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await supabase.rpc('cleanup_expired_admin_sessions');
}