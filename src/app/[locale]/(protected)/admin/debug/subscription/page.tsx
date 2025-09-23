'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useState } from 'react';

/**
 * 订阅状态调试页面
 * 仅限管理员使用
 */
export default function SubscriptionDebugPage() {
  const currentUser = useCurrentUser();
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debugResults, setDebugResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundUsers, setFoundUsers] = useState<any[]>([]);

  // 检查是否为管理员
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">访问被拒绝</CardTitle>
          </CardHeader>
          <CardContent>
            <p>此页面仅限管理员访问。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const runDiagnostic = async (action: string) => {
    if (!userId.trim()) {
      alert('请输入用户ID');
      return;
    }

    setIsLoading(true);
    setDebugResults('正在执行诊断...\n');

    try {
      const response = await fetch('/api/debug/subscription-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId.trim(), action }),
      });

      const data = await response.json();

      if (response.ok) {
        setDebugResults(
          (prev) =>
            prev +
            `\n✅ ${action} 执行成功:\n${JSON.stringify(data, null, 2)}\n\n`
        );
      } else {
        setDebugResults(
          (prev) =>
            prev +
            `\n❌ ${action} 执行失败:\n${JSON.stringify(data, null, 2)}\n\n`
        );
      }
    } catch (error) {
      setDebugResults(
        (prev) => prev + `\n❌ ${action} 执行出错:\n${error}\n\n`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const runFullDiagnostic = async () => {
    if (!userId.trim()) {
      alert('请输入用户ID');
      return;
    }

    setIsLoading(true);
    setDebugResults(`🔍 开始完整诊断用户: ${userId}\n${'='.repeat(50)}\n`);

    const actions = [
      'getActiveSubscription',
      'getAllPayments',
      'checkStripeStatus',
    ];

    for (const action of actions) {
      setDebugResults((prev) => prev + `\n📋 执行 ${action}...\n`);

      try {
        const response = await fetch('/api/debug/subscription-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userId.trim(), action }),
        });

        const data = await response.json();

        if (response.ok) {
          setDebugResults(
            (prev) => prev + `✅ 成功:\n${JSON.stringify(data, null, 2)}\n\n`
          );
        } else {
          setDebugResults(
            (prev) => prev + `❌ 失败:\n${JSON.stringify(data, null, 2)}\n\n`
          );
        }
      } catch (error) {
        setDebugResults((prev) => prev + `❌ 出错:\n${error}\n\n`);
      }
    }

    setDebugResults((prev) => prev + `\n${'='.repeat(50)}\n🏁 诊断完成\n`);
    setIsLoading(false);
  };

  const clearResults = () => {
    setDebugResults('');
  };

  const findUserByEmail = async () => {
    if (!email.trim()) {
      alert('请输入邮箱地址');
      return;
    }

    setIsLoading(true);
    setDebugResults('正在根据邮箱查找用户...\n');

    try {
      const response = await fetch('/api/debug/subscription-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'findUserByEmail',
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.found) {
        setUserId(data.user.id);
        setDebugResults(
          (prev) =>
            prev +
            `✅ 找到用户:\n用户ID: ${data.user.id}\n邮箱: ${data.user.email}\n姓名: ${data.user.name}\n注册时间: ${data.user.createdAt}\n订阅状态: ${data.subscriptionSummary.hasActiveSubscription ? '有活跃订阅' : '无活跃订阅'}\n\n`
        );
      } else {
        setDebugResults((prev) => prev + `❌ 未找到用户: ${email}\n\n`);
      }
    } catch (error) {
      setDebugResults((prev) => prev + `❌ 查找出错: ${error}\n\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      alert('请输入至少2个字符的搜索词');
      return;
    }

    setIsLoading(true);
    setDebugResults('正在搜索用户...\n');

    try {
      const response = await fetch('/api/debug/subscription-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'searchUsers',
          searchTerm: searchTerm.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFoundUsers(data.users);
        setDebugResults(
          (prev) => prev + `✅ 找到 ${data.totalFound} 个用户:\n`
        );
        data.users.forEach((user: any, index: number) => {
          setDebugResults(
            (prev) =>
              prev +
              `${index + 1}. ${user.name} (${user.email})\n   ID: ${user.id}\n   订阅: ${user.subscriptionSummary.hasActiveSubscription ? '活跃' : '无'}\n\n`
          );
        });
      } else {
        setDebugResults(
          (prev) => prev + `❌ 搜索失败: ${JSON.stringify(data, null, 2)}\n\n`
        );
      }
    } catch (error) {
      setDebugResults((prev) => prev + `❌ 搜索出错: ${error}\n\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectUser = (user: any) => {
    setUserId(user.id);
    setEmail(user.email);
    setDebugResults(
      (prev) =>
        prev +
        `👤 已选择用户: ${user.name} (${user.email})\n用户ID: ${user.id}\n\n`
    );
  };

  const quickCheck = async () => {
    if (!userId.trim()) {
      alert('请输入用户ID');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/debug/subscription-status?userId=${encodeURIComponent(userId.trim())}`
      );
      const data = await response.json();

      if (response.ok) {
        setDebugResults(`🚀 快速检查结果:\n${JSON.stringify(data, null, 2)}\n`);
      } else {
        setDebugResults(`❌ 快速检查失败:\n${JSON.stringify(data, null, 2)}\n`);
      }
    } catch (error) {
      setDebugResults(`❌ 快速检查出错:\n${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">订阅状态调试工具</h1>
        <p className="text-muted-foreground">
          用于诊断用户订阅状态问题，检查数据库记录与Stripe状态的一致性。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户查找</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">通过邮箱查找用户</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="输入用户邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  onClick={findUserByEmail}
                  disabled={isLoading}
                  variant="outline"
                  size="default"
                >
                  查找
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="searchTerm">搜索用户</Label>
              <div className="flex gap-2">
                <Input
                  id="searchTerm"
                  placeholder="邮箱、姓名或用户ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  onClick={searchUsers}
                  disabled={isLoading}
                  variant="outline"
                  size="default"
                >
                  搜索
                </Button>
              </div>
            </div>
          </div>

          {foundUsers.length > 0 && (
            <div>
              <Label>搜索结果 (点击选择用户)</Label>
              <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                {foundUsers.map((user, index) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="h-auto p-3 justify-start text-left"
                    onClick={() => selectUser(user)}
                    disabled={isLoading}
                  >
                    <div className="flex flex-col items-start">
                      <div className="font-medium">
                        {user.name} ({user.email})
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {user.id} | 订阅:{' '}
                        {user.subscriptionSummary.hasActiveSubscription
                          ? '活跃'
                          : '无'}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>订阅调试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userId">用户ID</Label>
            <Input
              id="userId"
              placeholder="输入要调试的用户ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={quickCheck} disabled={isLoading} variant="outline">
              快速检查
            </Button>

            <Button onClick={runFullDiagnostic} disabled={isLoading}>
              完整诊断
            </Button>

            <Button
              onClick={() => runDiagnostic('getActiveSubscription')}
              disabled={isLoading}
              variant="outline"
            >
              检查活跃订阅
            </Button>

            <Button
              onClick={() => runDiagnostic('getAllPayments')}
              disabled={isLoading}
              variant="outline"
            >
              查看支付记录
            </Button>

            <Button
              onClick={() => runDiagnostic('checkStripeStatus')}
              disabled={isLoading}
              variant="outline"
            >
              验证Stripe状态
            </Button>

            <Button
              onClick={clearResults}
              disabled={isLoading}
              variant="destructive"
              size="sm"
            >
              清除结果
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>诊断结果</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={debugResults}
            readOnly
            placeholder="诊断结果将显示在这里..."
            className="h-96 font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>浏览器控制台调试</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            你也可以在浏览器控制台中直接运行诊断脚本：
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <code className="text-sm">
              {`// 1. 加载调试脚本
const script = document.createElement('script');
script.src = '/debug-subscription-status.js';
document.head.appendChild(script);

// 2. 运行诊断
debugSubscriptionStatus('${userId || '用户ID'}');`}
            </code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>常见问题排查</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold">1. 用户取消订阅后仍享受福利</h4>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>检查数据库中的status字段是否为"canceled"</li>
                <li>验证Stripe webhook是否正常工作</li>
                <li>确认没有多个活跃订阅记录</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">2. 数据库与Stripe状态不一致</h4>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>检查webhook处理日志</li>
                <li>手动同步Stripe状态</li>
                <li>检查网络连接和API密钥</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">3. 订阅检查逻辑问题</h4>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>验证getActiveSubscriptionAction的查询条件</li>
                <li>检查是否有缓存问题</li>
                <li>确认时区和时间戳处理</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
