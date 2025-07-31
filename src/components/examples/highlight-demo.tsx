'use client';

import { CustomHighlightText } from '@/components/custom/highlight';
import { HighlightText } from '@/components/animate-ui/text/highlight';

export function HighlightDemo() {
  return (
    <div className="p-8 space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">现有高亮组件演示</h2>

        {/* CustomHighlightText 示例 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">CustomHighlightText</h3>
          <p className="text-gray-600">
            使用 <CustomHighlightText text="AI 图像生成" inView={true} /> 创建精美艺术作品
          </p>

          {/* 自定义样式 */}
          <p className="text-gray-600">
            <CustomHighlightText
              text="RoboNeo"
              inView={true}
              className="bg-gradient-to-r from-yellow-200 to-orange-200 dark:from-yellow-400 dark:to-orange-400 font-bold"
              transition={{ duration: 1.5, ease: "easeOut" }}
            /> 让创作变得简单
          </p>
        </div>

        {/* HighlightText 示例 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">HighlightText</h3>
          <p className="text-gray-600">
            <HighlightText text="秒级转换" inView={true} /> 您的照片和创意
          </p>

          {/* 延迟动画效果 */}
          <p className="text-gray-600">
            加入 <HighlightText
              text="数千名创作者"
              inView={true}
              transition={{ duration: 2, delay: 0.5 }}
            /> 的行列
          </p>
        </div>

        {/* 组合使用示例 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">组合使用</h3>
          <div className="text-lg">
            <CustomHighlightText
              text="AI 驱动"
              inView={true}
              className="bg-gradient-to-r from-green-200 to-blue-200 dark:from-green-400 dark:to-blue-400"
            /> 的 <HighlightText text="创作工具" inView={true} />，
            让每个人都能成为 <CustomHighlightText
              text="艺术家"
              inView={true}
              className="bg-gradient-to-r from-pink-200 to-purple-200 dark:from-pink-400 dark:to-purple-400"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-2">使用方法：</h3>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono">
          <div className="space-y-2">
            <div>// 导入组件</div>
            <div className="text-blue-600">import &#123; CustomHighlightText &#125; from '@/components/custom/highlight';</div>
            <div className="text-blue-600">import &#123; HighlightText &#125; from '@/components/animate-ui/text/highlight';</div>
            <div className="mt-4">// 使用组件</div>
            <div>&lt;<span className="text-green-600">CustomHighlightText</span> text="您的文字" inView=&#123;true&#125; /&gt;</div>
            <div>&lt;<span className="text-green-600">HighlightText</span> text="您的文字" inView=&#123;true&#125; /&gt;</div>
          </div>
        </div>
      </div>
    </div>
  );
}
