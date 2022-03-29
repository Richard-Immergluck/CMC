import Link from "next/link";
import { useRouter } from "next/router";

function Review() {
  const router = useRouter();
  const { trackId, reviewId } = router.query;

  return (
    <>
      <Link href={"/"}>
        <a>Home</a>
      </Link>
      <h1>{trackId} Track name</h1>
      <h2>{reviewId} Specific Review Content</h2>
    </>
  );
}

export default Review;
