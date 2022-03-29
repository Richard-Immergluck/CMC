import { getSession } from "next-auth/react";

function Blog({ data }) {
  return <h1>Blog - {data}</h1>;
}

export default Blog;

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const blogUrl = 'http://localhost:3000/blog'

  if(!session) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${blogUrl}`,
        permanent: false
      }
    }
  }

  return {
    props: {
      data: session ? `List of 100 personalised blogs` : `list of free blogs`,
    },
  };
}
