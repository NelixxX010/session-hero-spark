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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Dashboard Admin</h1>
            <p className="text-muted-foreground mt-2">Bienvenue {user?.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Déconnexion
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Nombre de recherches</CardTitle>
              <CardDescription>Total des recherches effectuées</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{searchCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visites du site</CardTitle>
              <CardDescription>Total des visites</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{visits.reduce((acc, v) => acc + v.count, 0)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Visites par jour</CardTitle>
            <CardDescription>Graphique des 7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={visits}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
