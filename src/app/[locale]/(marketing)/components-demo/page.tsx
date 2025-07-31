import { HighlightDemo } from '@/components/examples/highlight-demo';
import { AdvancedHighlightDemo } from '@/components/examples/advanced-highlight-demo';
import Container from '@/components/layout/container';

export default function ComponentsDemoPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] py-8">
      <Container className="max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎨 高亮组件演示</h1>
          <p className="text-lg text-muted-foreground">
            查看项目中所有可用的高亮组件效果
          </p>
        </div>

        <div className="space-y-12">
          {/* 现有组件演示 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">📦 现有高亮组件</h2>
            <HighlightDemo />
          </div>

          {/* 增强版组件演示 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">🚀 增强版高亮组件</h2>
            <AdvancedHighlightDemo />
          </div>
        </div>
      </Container>
    </div>
  );
}
