import Link from "next/link";
import { useRouter } from "next/router";

function PostId() {
  const router = useRouter();
  const postId = router.query.postId;
  return (
    <>
      <Link href={"/"}>
        <a>Home</a>
      </Link>
      <h1>{postId}</h1>
      <h2>Post Title</h2>
      <hr />
      <p>Post content</p>
    </>
  );
}

export default PostId;