import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Layout } from "@/components/layout";
import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { session, loading } = useAuth();
  const { data: profile, isLoading } = useGetMe({ query: { enabled: !!session, queryKey: ['getMe'] } });

  if (loading) return null;
  if (!session) return <Redirect to="/login" />;

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold mb-8">Welcome back.</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || !profile ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Name</div>
                    <div className="text-lg font-medium">{profile.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div className="text-lg font-medium">{profile.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Member Since</div>
                    <div className="text-base">{new Date(profile.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
