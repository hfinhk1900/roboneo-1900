'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Search, Trash2, User, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface UserDeletionPreview {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    credits: number;
    role?: string;
  };
  dataToDelete: {
    assets: number;
    aibgHistory: number;
    profilePictureHistory: number;
    stickerHistory: number;
    productshotHistory: number;
    watermarkHistory: number;
    creditsTransactions: number;
    totalRecords: number;
  };
  isAdmin: boolean;
  canDelete: boolean;
}

export function UserManagement() {
  const [searchEmail, setSearchEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userPreview, setUserPreview] = useState<UserDeletionPreview | null>(
    null
  );

  // 搜索用户并获取删除预览
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error('请输入用户邮箱');
      return;
    }

    setIsLoading(true);
    try {
      // 注意：这里需要一个API来通过邮箱查找用户ID
      const searchRes = await fetch(
        `/api/admin/find-user?email=${encodeURIComponent(searchEmail)}`
      );

      if (!searchRes.ok) {
        const error = await searchRes.json();
        toast.error(error.error || '查找用户失败');
        return;
      }

      const { userId } = await searchRes.json();

      // 获取删除预览
      const previewRes = await fetch(`/api/admin/delete-user?userId=${userId}`);

      if (!previewRes.ok) {
        const error = await previewRes.json();
        toast.error(error.error || '获取用户信息失败');
        return;
      }

      const preview = await previewRes.json();
      setUserPreview(preview);
      setShowDeleteDialog(true);
    } catch (error) {
      console.error('Search user error:', error);
      toast.error('搜索用户时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 执行用户删除
  const handleDeleteUser = async () => {
    if (!userPreview) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/delete-user?userId=${userPreview.user.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || '删除用户失败');
        return;
      }

      const result = await response.json();
      toast.success(`用户 ${result.deletedData.email} 已完全删除`);

      // 重置状态
      setShowDeleteDialog(false);
      setUserPreview(null);
      setSearchEmail('');
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('删除用户时发生错误');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            用户管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email">用户邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="输入要删除的用户邮箱..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearchUser}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isLoading ? '搜索中...' : '搜索用户'}
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            ⚠️ <strong>危险操作</strong>：删除用户将永久清除所有相关数据，包括：
            <ul className="list-disc list-inside mt-2 ml-4">
              <li>用户账户信息和登录凭据</li>
              <li>所有生成的图片和文件存储</li>
              <li>历史记录（AI背景、头像制作、贴纸生成等）</li>
              <li>积分记录和交易历史</li>
              <li>付费订阅信息</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              确认删除用户
            </DialogTitle>
            <DialogDescription>
              此操作将永久删除用户及其所有数据，无法撤销。
            </DialogDescription>
          </DialogHeader>

          {userPreview && (
            <div className="space-y-4">
              {/* 用户信息 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">用户信息</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>邮箱:</strong> {userPreview.user.email}
                  </div>
                  <div>
                    <strong>姓名:</strong> {userPreview.user.name}
                  </div>
                  <div>
                    <strong>积分:</strong> {userPreview.user.credits}
                  </div>
                  <div>
                    <strong>注册时间:</strong>{' '}
                    {new Date(userPreview.user.createdAt).toLocaleString()}
                  </div>
                  {userPreview.user.role && (
                    <div>
                      <strong>角色:</strong> {userPreview.user.role}
                    </div>
                  )}
                </div>
              </div>

              {/* 数据统计 */}
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">待删除数据</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>资产文件: {userPreview.dataToDelete.assets} 个</div>
                  <div>
                    AI背景历史: {userPreview.dataToDelete.aibgHistory} 条
                  </div>
                  <div>
                    头像制作历史:{' '}
                    {userPreview.dataToDelete.profilePictureHistory} 条
                  </div>
                  <div>
                    贴纸生成历史: {userPreview.dataToDelete.stickerHistory} 条
                  </div>
                  <div>
                    产品拍摄历史: {userPreview.dataToDelete.productshotHistory}{' '}
                    条
                  </div>
                  <div>
                    水印移除历史: {userPreview.dataToDelete.watermarkHistory} 条
                  </div>
                  <div>
                    积分交易记录: {userPreview.dataToDelete.creditsTransactions}{' '}
                    条
                  </div>
                  <div className="pt-2 border-t border-red-200">
                    <strong>
                      总计: {userPreview.dataToDelete.totalRecords} 条记录
                    </strong>
                  </div>
                </div>
              </div>

              {/* 管理员保护 */}
              {userPreview.isAdmin && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">无法删除管理员用户</span>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={isDeleting || !userPreview.canDelete}
                  className="flex-1"
                >
                  {isDeleting ? '删除中...' : '确认删除'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
