'use client';

import { useParams } from 'next/navigation';

export default function GenderPage() {
  const params = useParams();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl">Gender Page Working! ✅</h1>
      <p>Gender param: {params.gender}</p>
    </div>
  );
}