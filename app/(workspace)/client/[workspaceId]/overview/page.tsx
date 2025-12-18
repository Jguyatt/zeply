/**
 * Redirect from old /overview route to new /dashboard route
 */

import { redirect } from 'next/navigation';

export default async function ClientOverviewRedirect({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  redirect(`/client/${workspaceId}/dashboard`);
}
