import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<any[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      loadStats();
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadStats = async () => {
    try {
      // Charger les visites
      const { data: visitsData, error: visitsError } = await supabase
        .from("site_visits")
        .select("*")
        .order("created_at", { ascending: false });

      if (visitsError) throw visitsError;

      // Grouper par jour
      const visitsByDay = visitsData?.reduce((acc: any, visit: any) => {
        const date = new Date(visit.created_at).toLocaleDateString("fr-FR");
        if (!acc[date]) {
          acc[date] = { date, count: 0 };
        }
        acc[date].count++;
        return acc;
      }, {});

      setVisits(Object.values(visitsByDay || {}).slice(0, 7).reverse());

      // Charger le nombre de recherches
      const { count, error: searchError } = await supabase
        .from("searches")
        .select("*", { count: "exact", head: true });

      if (searchError) throw searchError;

      setSearchCount(count || 0);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">CSint Admin</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" className="rounded-full">
            Déconnexion
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Tableau de bord</h2>
          <p className="text-muted-foreground">Bienvenue {user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardDescription>Nombre de recherches</CardDescription>
              <CardTitle className="text-4xl font-bold text-primary">{searchCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total des recherches effectuées</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardDescription>Visites du site</CardDescription>
              <CardTitle className="text-4xl font-bold text-primary">
                {visits.reduce((acc, v) => acc + v.count, 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total des visites enregistrées</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Visites par jour</CardTitle>
            <CardDescription>Évolution des 7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={visits}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem"
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
