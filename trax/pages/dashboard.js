import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";

function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const securePage = async () => {
      const session = await getSession();
      if (!session) {
        signIn();
      } else {
        setLoading(false);
      }
    }
    console.log("The state hook is currently set to ===> ", loading)
    securePage();
  }, []);

  console.log("The state hook is currently set to ===> ", loading)

  if (loading) {
    return <h2>Loading...</h2>;
  }
  return (
    <>
      <h1>Dashboard</h1>
      <p>
        This is a protected page that you should only be able to view if you are
        logged in!
      </p>
    </>
  );
}

export default Dashboard;
