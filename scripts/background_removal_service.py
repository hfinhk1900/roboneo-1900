#!/usr/bin/env python3
"""
免费去背景服务
使用 rembg 开源库实现专业级去背景效果
"""

import os
import sys
import base64
import io
from PIL import Image
from rembg import remove
import argparse

def remove_background_from_base64(base64_image: str) -> str:
    """
    从 base64 图片中去除背景

    Args:
        base64_image (str): base64 编码的图片

    Returns:
        str: 去除背景后的 base64 图片（PNG格式，透明背景）
    """
    try:
        # 解码 base64 图片
        if base64_image.startswith('data:'):
            # 移除 data:image/xxx;base64, 前缀
            base64_image = base64_image.split(',')[1]

        image_data = base64.b64decode(base64_image)

        # 打开图片
        input_image = Image.open(io.BytesIO(image_data))

        # 去除背景
        output_image = remove(input_image)

        # 转换为 base64
        buffer = io.BytesIO()
        output_image.save(buffer, format='PNG')
        buffer.seek(0)

        result_base64 = base64.b64encode(buffer.getvalue()).decode()

        return f"data:image/png;base64,{result_base64}"

    except Exception as e:
        raise Exception(f"去背景处理失败: {str(e)}")

def remove_background_from_file(input_path: str, output_path: str):
    """
    从文件中去除背景

    Args:
        input_path (str): 输入图片路径
        output_path (str): 输出图片路径
    """
    try:
        with open(input_path, 'rb') as input_file:
            input_image = Image.open(input_file)
            output_image = remove(input_image)
            output_image.save(output_path, format='PNG')

        print(f"✅ 成功去除背景: {input_path} -> {output_path}")

    except Exception as e:
        print(f"❌ 去背景失败: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='免费去背景工具')
    parser.add_argument('--input', '-i', required=True, help='输入图片路径')
    parser.add_argument('--output', '-o', required=True, help='输出图片路径')

    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"❌ 输入文件不存在: {args.input}")
        sys.exit(1)

    remove_background_from_file(args.input, args.output)

if __name__ == "__main__":
    main()

