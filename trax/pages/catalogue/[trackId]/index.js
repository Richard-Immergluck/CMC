import Link from "next/link";
import { useRouter } from "next/router";

function TrackId() {
  const router = useRouter();
  const trackId = router.query.trackId;
  return (
    <>
      <Link href={"/"}>
        <a>Home</a>
      </Link>
      <h1>{trackId}</h1>
      <h2>Track Title</h2>
      <hr />
      <p>Track content</p>
    </>
  );
}

export default TrackId;
