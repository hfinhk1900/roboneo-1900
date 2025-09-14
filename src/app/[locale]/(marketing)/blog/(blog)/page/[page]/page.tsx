import { notFound } from 'next/navigation';

export function generateStaticParams() { return []; }

export async function generateMetadata() { return {}; }

interface BlogListPageProps { params: Promise<any>; }

export default function BlogListPage() { notFound(); }
