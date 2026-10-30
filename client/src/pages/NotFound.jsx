import { Link } from 'react-router-dom';
import { Empty } from '../components/Status';

export default function NotFound() {
  return (
    <Empty>
      <h1>We can’t find that page</h1>
      <p>The link may be old or mistyped.</p>
      <Link to="/" className="btn">
        Back to the homepage
      </Link>
    </Empty>
  );
}
