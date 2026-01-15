import { z } from "zod";

export const contactSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().min(8, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  workType: z.enum(["company", "individual"]),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
