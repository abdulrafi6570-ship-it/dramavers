import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Layout } from "@/components/layout";
import { useListUsers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Users() {
  const { session, loading } = useAuth();
  const { data: users, isLoading } = useListUsers({ query: { enabled: !!session, queryKey: ['listUsers'] } });

  if (loading) return null;
  if (!session) return <Redirect to="/login" />;

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold mb-8">Users</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            users?.map((user, index) => (
              <Card 
                key={user.id} 
                className="animate-in fade-in zoom-in-95 fill-mode-both"
                style={{ animationDelay: `${index * 50}ms`, animationDuration: '300ms' }}
                data-testid={`card-user-${user.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                      <AvatarFallback className="bg-primary/5 text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold truncate">{user.name}</span>
                      <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                      <span className="text-xs text-muted-foreground/60 mt-1">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
