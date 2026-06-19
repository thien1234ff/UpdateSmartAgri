import { Suspense } from 'react';
import HomePage from './HomePage';

export default function Page() {
  return (
    <Suspense fallback={<div>Đang tải trang...</div>}>
      <HomePage />
    </Suspense>
  );
}
