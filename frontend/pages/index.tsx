import type { NextPage } from 'next';

const Home: NextPage = () => {
  return (
    <div>
      <p>API Base URL: {process.env.NEXT_PUBLIC_API_BASE_URL}</p>
    </div>
  );
};

export default Home;
