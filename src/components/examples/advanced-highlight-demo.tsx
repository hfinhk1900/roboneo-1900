'use client';

import {
  AdvancedHighlighter,
  GradientHighlight,
  MarkerHighlight,
  NeonHighlight,
  PrimaryHighlight,
} from '@/components/ui/advanced-highlighter';

export function AdvancedHighlightDemo() {
  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <h2 className="text-3xl font-bold text-center mb-8">
        🎨 增强版高亮组件演示
      </h2>

      {/* 基础变体 */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">🎭 不同样式变体</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
          <p>
            默认样式: <AdvancedHighlighter>AI 图像生成</AdvancedHighlighter>
          </p>
          <p>
            主题色:{' '}
            <AdvancedHighlighter variant="primary">RoboNeo</AdvancedHighlighter>
          </p>
          <p>
            成功状态:{' '}
            <AdvancedHighlighter variant="success">
              转换成功
            </AdvancedHighlighter>
          </p>
          <p>
            警告状态:{' '}
            <AdvancedHighlighter variant="warning">
              注意事项
            </AdvancedHighlighter>
          </p>
          <p>
            错误状态:{' '}
            <AdvancedHighlighter variant="error">处理失败</AdvancedHighlighter>
          </p>
          <p>
            渐变效果:{' '}
            <AdvancedHighlighter variant="gradient">
              艺术创作
            </AdvancedHighlighter>
          </p>
          <p>
            霓虹效果:{' '}
            <AdvancedHighlighter variant="neon">未来科技</AdvancedHighlighter>
          </p>
          <p>
            标记笔:{' '}
            <AdvancedHighlighter variant="marker">重点内容</AdvancedHighlighter>
          </p>
        </div>
      </div>

      {/* 动画效果 */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">✨ 不同动画效果</h3>
        <div className="space-y-3 text-lg">
          <p>
            淡入效果:{' '}
            <AdvancedHighlighter effect="fade" delay={0.2}>
              淡入动画
            </AdvancedHighlighter>
          </p>
          <p>
            滑入效果:{' '}
            <AdvancedHighlighter effect="slide" delay={0.4}>
              滑入动画
            </AdvancedHighlighter>
          </p>
          <p>
            打字机:{' '}
            <AdvancedHighlighter effect="typewriter" delay={0.6}>
              打字机效果
            </AdvancedHighlighter>
          </p>
          <p>
            脉冲效果:{' '}
            <AdvancedHighlighter effect="pulse" delay={0.8}>
              脉冲动画
            </AdvancedHighlighter>
          </p>
          <p>
            弹跳效果:{' '}
            <AdvancedHighlighter effect="bounce" delay={1.0}>
              弹跳动画
            </AdvancedHighlighter>
          </p>
        </div>
      </div>

      {/* 发光效果 */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">🌟 发光效果</h3>
        <div className="space-y-3 text-lg bg-gray-900 p-6 rounded-lg">
          <p className="text-white">
            普通:{' '}
            <AdvancedHighlighter variant="primary">无发光</AdvancedHighlighter>
          </p>
          <p className="text-white">
            发光:{' '}
            <AdvancedHighlighter variant="primary" glowing>
              主题发光
            </AdvancedHighlighter>
          </p>
          <p className="text-white">
            霓虹:{' '}
            <AdvancedHighlighter variant="neon" glowing>
              霓虹发光
            </AdvancedHighlighter>
          </p>
          <p className="text-white">
            渐变:{' '}
            <AdvancedHighlighter variant="gradient" glowing>
              渐变发光
            </AdvancedHighlighter>
          </p>
        </div>
      </div>

      {/* 预设组合 */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">🚀 预设组合组件</h3>
        <div className="space-y-3 text-lg">
          <p>
            主题高亮: <PrimaryHighlight>核心功能</PrimaryHighlight>
          </p>
          <p>
            渐变高亮: <GradientHighlight>精美效果</GradientHighlight>
          </p>
          <p>
            霓虹高亮: <NeonHighlight>科技感</NeonHighlight>
          </p>
          <p>
            标记高亮: <MarkerHighlight>重要提醒</MarkerHighlight>
          </p>
        </div>
      </div>

      {/* 实际应用场景 */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">💼 实际应用场景</h3>
        <div className="space-y-4">
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-lg font-semibold mb-3">产品介绍</h4>
            <p className="text-base leading-relaxed">
              <GradientHighlight effect="slide">RoboNeo AI</GradientHighlight>{' '}
              是一款革命性的
              <PrimaryHighlight effect="fade" delay={0.3}>
                图像生成工具
              </PrimaryHighlight>
              ， 能够在{' '}
              <MarkerHighlight effect="bounce" delay={0.6}>
                几秒钟内
              </MarkerHighlight>
              将您的照片转换为令人惊艳的艺术作品。 支持多种风格，
              <NeonHighlight effect="pulse" delay={0.9}>
                无需专业技能
              </NeonHighlight>
              ！
            </p>
          </div>

          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-lg font-semibold mb-3">功能特点</h4>
            <ul className="space-y-2 text-base">
              <li>
                ✨{' '}
                <AdvancedHighlighter variant="success" effect="slide">
                  一键转换
                </AdvancedHighlighter>{' '}
                - 上传照片即可开始
              </li>
              <li>
                🎨{' '}
                <AdvancedHighlighter
                  variant="gradient"
                  effect="fade"
                  delay={0.2}
                >
                  多种风格
                </AdvancedHighlighter>{' '}
                - 卡通、油画、素描等
              </li>
              <li>
                ⚡{' '}
                <AdvancedHighlighter
                  variant="warning"
                  effect="bounce"
                  delay={0.4}
                >
                  极速处理
                </AdvancedHighlighter>{' '}
                - 平均处理时间 3 秒
              </li>
              <li>
                🔒{' '}
                <AdvancedHighlighter
                  variant="primary"
                  effect="typewriter"
                  delay={0.6}
                >
                  隐私保护
                </AdvancedHighlighter>{' '}
                - 本地处理，数据安全
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 使用代码示例 */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">💻 代码使用示例</h3>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto">
          <div className="space-y-2">
            <div className="text-gray-600 dark:text-gray-400">// 导入组件</div>
            <div className="text-blue-600">
              import &#123; AdvancedHighlighter, PrimaryHighlight &#125; from
              '@/components/ui/advanced-highlighter';
            </div>

            <div className="text-gray-600 dark:text-gray-400 mt-4">
              // 基础使用
            </div>
            <div>
              &lt;<span className="text-green-600">AdvancedHighlighter</span>{' '}
              variant="primary"&gt;高亮文字&lt;/
              <span className="text-green-600">AdvancedHighlighter</span>&gt;
            </div>

            <div className="text-gray-600 dark:text-gray-400 mt-2">
              // 带动画效果
            </div>
            <div>
              &lt;<span className="text-green-600">AdvancedHighlighter</span>{' '}
              variant="gradient" effect="slide" glowing&gt;炫酷效果&lt;/
              <span className="text-green-600">AdvancedHighlighter</span>&gt;
            </div>

            <div className="text-gray-600 dark:text-gray-400 mt-2">
              // 使用预设组件
            </div>
            <div>
              &lt;<span className="text-green-600">PrimaryHighlight</span>
              &gt;快速使用&lt;/
              <span className="text-green-600">PrimaryHighlight</span>&gt;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
