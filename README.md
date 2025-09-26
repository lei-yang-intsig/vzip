# VZip - 视频批量压缩工具

🎬 一个基于 FFmpeg 的轻量级视频批量压缩命令行工具，支持 MP4 视频文件的高效压缩。

## 特性

- 🚀 **批量处理**: 一次性压缩目录下所有 MP4 视频文件
- 🎯 **质量控制**: 支持高、中、低三种质量档位
- 🧠 **智能压缩**: 支持目标文件大小，自动调整参数直到达到目标
- ⚡ **灵活帧率**: 支持自定义帧率设置
- 📱 **快速启动**: 支持 faststart 选项，优化网络播放
- 📊 **实时反馈**: 显示压缩后的文件大小信息
- 🎨 **友好输出**: 彩色命令行输出，实时显示处理进度
- 💪 **稳定可靠**: 基于 FFmpeg-static，无需单独安装 FFmpeg

## 安装

```bash
# 全局安装（推荐）
npm install -g vzip

# 或者本地安装
npm install vzip
```

### 包管理器兼容性

⚠️ **重要提示**: 建议使用 **npm** 安装，不推荐使用 pnpm。

- ✅ **推荐**: `npm install -g vzip`
- ❌ **不推荐**: `pnpm add -g vzip` (可能导致 FFmpeg 路径问题)

如果您已经用 pnpm 安装了，请先卸载再用 npm 重新安装：

```bash
pnpm remove -g vzip
npm install -g vzip
```

## 使用方法

```bash
vzip <directory> [options]
```

### 参数说明

- `<directory>`: **必需** - 包含要压缩的视频文件的目录路径
- `--fps <fps>`: 设置帧率（默认 30fps）
- `--quality <level>`: 设置视频质量等级（可选值：high, medium, low，默认 medium）
- `--target-size-mb <size>`: 设置目标文件大小（MB），工具会自动调整参数直到达到目标
- `--clear-temp`: 在使用目标大小压缩时清理中间临时文件（默认关闭）
- `--faststart`: 启用 faststart，将 moov 原子移到文件开头以优化网络播放

### 使用示例

```bash
# 基本用法：压缩指定目录下的所有 MP4 文件
vzip ./videos

# 使用高质量压缩
vzip ./videos --quality high

# 设置目标文件大小为 10MB（智能压缩）
vzip ./videos --target-size-mb 10

# 设置自定义帧率
vzip ./videos --fps 24

# 启用 faststart 优化
vzip ./videos --faststart

# 组合使用多个选项
vzip ./videos --quality high --fps 30 --faststart

# 智能压缩到指定大小，并优化播放
vzip ./videos --target-size-mb 5 --faststart

# 智能压缩 + 自动清理中间文件
vzip ./videos --target-size-mb 8 --clear-temp
```

## 质量设置详解

| 质量等级 | CRF 值 | 描述                     | 适用场景                 |
| -------- | ------ | ------------------------ | ------------------------ |
| `high`   | 18     | 高质量，文件较大         | 专业用途，质量要求高     |
| `medium` | 23     | 中等质量，平衡大小和质量 | 日常使用，推荐设置       |
| `low`    | 28     | 低质量，文件较小         | 快速分享，对质量要求不高 |

## 智能压缩功能

当使用 `--target-size-mb` 参数时，工具会自动调整压缩参数直到达到目标文件大小：

1. **初始压缩**: 使用默认参数进行第一次压缩
2. **大小检查**: 检查压缩后的文件大小
3. **参数调整**: 如果未达到目标，自动调整 CRF、码率、预设等参数
4. **递归压缩**: 重复压缩直到达到目标大小
5. **临时文件清理** (可选): 使用 `--clear-temp` 自动清理中间产生的文件

### 调整策略

- **CRF 增加**: 逐步提高 CRF 值，增强压缩率
- **码率降低**: 当 CRF > 28 时，降低视频码率
- **帧率调整**: 当 CRF > 30 时，将帧率降低到 24fps
- **极致压缩**: 当 CRF > 32 时，使用最低码率 500k

## 输出说明

压缩后的文件将保存在原目录中，文件名格式为：`原文件名-compressed.mp4`

例如：`video.mp4` → `video-compressed.mp4`

## 技术细节

- **视频编码**: H.264 (libx264)
- **音频编码**: AAC，128k 比特率
- **预设**: slow / veryslow（根据情况自动调整）
- **码率控制**: 支持自适应调整（500k-3000k）
- **CRF 范围**: 23-32+（智能调整）
- **基于**: FFmpeg-static

## 系统要求

- Node.js >= 14.0.0
- 支持 Windows、macOS、Linux

## 依赖项

- [ffmpeg-static](https://www.npmjs.com/package/ffmpeg-static) - 静态 FFmpeg 二进制文件
- [commander](https://www.npmjs.com/package/commander) - 命令行接口框架
- [chalk](https://www.npmjs.com/package/chalk) - 终端彩色输出

## 示例输出

### 基本压缩

```bash
$ vzip ./my-videos --faststart

Found 3 video(s) to compress.
Compressing: video1.mp4...
Compressed: ./my-videos/video1-compressed.mp4 - Size: 15.23 MB
Successfully compressed: video1.mp4
Compressing: video2.mp4...
Compressed: ./my-videos/video2-compressed.mp4 - Size: 8.76 MB
Successfully compressed: video2.mp4
Compressing: video3.mp4...
Compressed: ./my-videos/video3-compressed.mp4 - Size: 12.45 MB
Successfully compressed: video3.mp4
```

### 智能压缩示例

```bash
$ vzip ./my-videos --target-size-mb 6 --clear-temp

Found 1 video(s) to compress.
Compressing: large-video.mp4...
Compressed: ./my-videos/large-video-compressed.mp4 - Size: 25.34 MB
Target size not reached! Current size: 25.34 MB
Recompressing: large-video-compressed.mp4...
Compressed: ./my-videos/large-video-compressed-compressed.mp4 - Size: 8.67 MB
Target size not reached! Current size: 8.67 MB
Recompressing: large-video-compressed-compressed.mp4...
Compressed: ./my-videos/large-video-compressed-compressed-compressed.mp4 - Size: 5.45 MB
Cleaning up temporary files...
Deleted: large-video-compressed.mp4
Deleted: large-video-compressed-compressed.mp4
Temporary files cleaned up!
Successfully compressed: large-video.mp4
```

## 注意事项

- 目前仅支持 MP4 格式的输入文件
- 压缩过程中请勿移动或删除原文件
- 大文件压缩可能需要较长时间，请耐心等待
- 智能压缩可能需要多次迭代，请确保有足够的硬盘空间
- 目标文件大小设置得太小可能影响视频质量
- 不建议使用 pnpm 安装，可能导致 FFmpeg 路径问题

## 常见问题

**Q: 为什么没有找到视频文件？**
A: 请确保目录中包含 `.mp4` 格式的文件，且文件扩展名为小写。

**Q: 压缩后文件变大了？**
A: 对于已经高度压缩的视频，再次压缩可能会增加文件大小。建议先测试一个文件。

**Q: 支持其他视频格式吗？**
A: 目前仅支持 MP4 格式，后续版本将添加更多格式支持。

**Q: 智能压缩需要多长时间？**
A: 取决于目标大小和原始文件大小，可能需要多次迭代压缩，请耐心等待。

**Q: 为什么无法达到目标文件大小？**
A: 极小的目标大小可能无法实现，工具会尽力压缩但不保证一定能达到。

**Q: pnpm 安装后报错 "No such file or directory"？**
A: 这是 pnpm 与 FFmpeg 的兼容性问题。请使用 npm 安装：`pnpm remove -g vzip && npm install -g vzip`

## 许可证

ISC

## 贡献

欢迎提交 Issue 和 Pull Request！

---

如果这个工具对你有帮助，请给个 ⭐ Star！
