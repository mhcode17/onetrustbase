import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { UserAvatar } from "@/components/Avatar";
import { ActionButton } from "@/components/ActionButton";
import { setUserRoleAction, setUserBanAction } from "@/lib/actions/admin";
import { displayName, formatDate } from "@/lib/format";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { reviews: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted">
          Promote moderators or suspend abusive accounts.
        </p>
      </div>

      <div className="space-y-2">
        {users.map((u) => {
          const isSelf = u.id === me?.id;
          return (
            <div key={u.id} className="card flex flex-wrap items-center gap-4 p-4">
              <UserAvatar name={displayName(u)} photoUrl={u.photoUrl} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-100">{displayName(u)}</span>
                  {u.role === "ADMIN" && <span className="badge-brand">Admin</span>}
                  {u.isBanned && <span className="badge-danger">Banned</span>}
                  {isSelf && <span className="chip">You</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {u.username ? `@${u.username} · ` : ""}TG ID {u.telegramId.toString()} ·{" "}
                  {u._count.reviews} review{u._count.reviews === 1 ? "" : "s"} · joined{" "}
                  {formatDate(u.createdAt)}
                </p>
              </div>

              {!isSelf && (
                <div className="flex flex-wrap items-center gap-2">
                  {u.role === "ADMIN" ? (
                    <ActionButton
                      action={setUserRoleAction.bind(null, u.id, "USER")}
                      className="btn-ghost"
                      confirm="Remove admin rights from this user?"
                    >
                      Demote
                    </ActionButton>
                  ) : (
                    <ActionButton
                      action={setUserRoleAction.bind(null, u.id, "ADMIN")}
                      className="btn-ghost"
                      confirm="Grant admin rights to this user?"
                    >
                      Make admin
                    </ActionButton>
                  )}
                  {u.isBanned ? (
                    <ActionButton
                      action={setUserBanAction.bind(null, u.id, false)}
                      className="btn-ok"
                    >
                      Unban
                    </ActionButton>
                  ) : (
                    <ActionButton
                      action={setUserBanAction.bind(null, u.id, true)}
                      className="btn-danger"
                      confirm="Suspend this user?"
                    >
                      Ban
                    </ActionButton>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
