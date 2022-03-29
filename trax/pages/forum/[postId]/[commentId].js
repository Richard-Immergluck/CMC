import Link from "next/link";
import { useRouter } from "next/router";

function Comment() {
  const router = useRouter();
  const { postId, commentId } = router.query;

  return (
    <>
      <Link href={"/"}>
        <a>Home</a>
      </Link>
      <h1>{postId} Post name</h1>
      <h2>{commentId} Specific Comment Content</h2>
    </>
  );
}

export default Comment;
