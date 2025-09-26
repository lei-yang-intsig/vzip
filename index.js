#!/usr/bin/env node
// index.js
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { program } = require('commander');
const chalk = require('chalk');

// 验证 FFmpeg 路径是否存在
const validateFFmpegPath = () => {
    if (!ffmpegPath) {
        throw new Error('FFmpeg path is not available. This might be a package manager compatibility issue.');
    }
    
    if (!fs.existsSync(ffmpegPath)) {
        throw new Error(`FFmpeg binary not found at: ${ffmpegPath}\n\nThis is likely due to pnpm compatibility issues. Please try:\n1. Uninstall: pnpm remove -g vzip\n2. Install with npm: npm install -g vzip`);
    }
    
    console.log(chalk.gray(`Using FFmpeg: ${ffmpegPath}`));
};

// 计算文件大小的函数
const getFileSizeInMB = (filePath) => {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024); // 返回 MB
};

const getHandleName = (inputFile) => {
    const outputFileName = `${path.basename(inputFile, path.extname(inputFile))}-compressed.mp4`;
    return outputFileName;
};

// 处理视频文件压缩的函数
const compressVideo = async (inputFile, outputDir, fps = 30, quality = 'medium', faststart = false, targetSizeMB, clearTemp = false) => {
    const originalInputFile = inputFile; // 保存原始文件路径
    let outputFileName = getHandleName(inputFile);
    let outputPath = path.join(outputDir, outputFileName);
    
    // 用于跟踪中间临时文件的数组
    const tempFiles = [];

    let crf = 23;  // 默认质量（中等）
    if (quality === 'high') {
        crf = 18;
    } else if (quality === 'low') {
        crf = 28;
    } else {
        crf = 23;
    }
    // 初始 CRF 和预设值
    let preset = 'slow';  // 预设（压缩速度：ultrafast → slow）
    let bitrate = '3000k';  // 初始码率

    // 文件大小目标值
    let currentFileSizeMB = 0;

    const faststartFlag = faststart ? '-movflags +faststart' : '';
    const fpsFlag = `-r ${fps}`;

    // 递归调整压缩参数直到达到目标文件大小
    const compress = async () => {
        const command = `${ffmpegPath} -i "${inputFile}" ${fpsFlag} -crf ${crf} -preset ${preset} -b:v ${bitrate} -c:v libx264 -c:a aac -b:a 128k ${faststartFlag} "${outputPath}"`;

        return new Promise((resolve, reject) => {
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    reject(`Error in compress: ${err}, ${stderr}`);
                } else {
                    currentFileSizeMB = getFileSizeInMB(outputPath);
                    console.log(chalk.green(`Compressed: ${outputPath} - Size: ${currentFileSizeMB.toFixed(2)} MB`));
                    resolve();
                }
            });
        });
    };
    await compress();
    
    // 如果启用了目标大小控制，且第一次压缩就达到了目标，直接返回
    if (targetSizeMB && currentFileSizeMB <= targetSizeMB) {
        return;
    }

    while (targetSizeMB && currentFileSizeMB > targetSizeMB) {
        console.log(chalk.yellow(`Target size not reached! Current size: ${currentFileSizeMB.toFixed(2)} MB`));
        console.log(chalk.yellow(`Recompressing: ${outputFileName}...`));

        // 如果需要清理临时文件，将当前输出文件添加到临时文件列表
        if (clearTemp && targetSizeMB) {
            tempFiles.push(outputPath);
        }

        // 如果文件过大，调整 CRF 值增加压缩率
        crf += 1; // 提高 CRF，减小文件大小
    
        // 可以增加其他压缩手段，比如降低分辨率、降低音频质量等，来进一步压缩
        if (crf > 25) {
            preset = 'veryslow';  // 如果压缩得太多，可以减慢预设
        }
        if (crf > 28) {
            bitrate = '1500k';  // 进一步减少码率
        }

        if (crf > 30) {
            fps = 24;
            bitrate = '1000k';  // 进一步减少码率
        }

        if (crf > 32) {
            bitrate = '500k';  // 进一步减少码率
        }
    
        // 重新压缩
        // 压缩上一次未达标的文件
        inputFile = outputPath;
        outputFileName = getHandleName(inputFile);
        outputPath = path.join(outputDir, outputFileName);
        await compress();
    }
    
    // 清理临时文件
    if (clearTemp && tempFiles.length > 0) {
        console.log(chalk.blue('Cleaning up temporary files...'));
        for (const tempFile of tempFiles) {
            try {
                if (fs.existsSync(tempFile) && tempFile !== originalInputFile) {
                    fs.unlinkSync(tempFile);
                    console.log(chalk.gray(`Deleted: ${path.basename(tempFile)}`));
                }
            } catch (err) {
                console.log(chalk.yellow(`Warning: Could not delete ${path.basename(tempFile)}: ${err.message}`));
            }
        }
        console.log(chalk.green('Temporary files cleaned up!'));
    }
};

// 定义命令行接口
program
  .name('vzip')
  .description('Batch video compression tool using ffmpeg')
  .argument('<directory>', 'Directory containing videos to compress')
  .option('--fps <fps>', 'Set frame rate to fps', 30)
  .option('--quality <level>', 'Set video quality level (high, medium, low)', 'medium')
  .option('--faststart', 'Move moov atom to the beginning of the file', false)
  .option('--target-size-mb <size>', 'Set target size in MB')
  .option('--clear-temp', 'Clear temporary files when using target size compression', false)
  .action(async (directory, options) => {
    try {
      // 验证 FFmpeg 路径
      validateFFmpegPath();
      
      const files = fs.readdirSync(directory);
      const videoFiles = files.filter(file => ['.mp4'].includes(path.extname(file).toLowerCase()));

      if (videoFiles.length === 0) {
        console.log(chalk.yellow('No MP4 files found in this directory.'));
        return;
      }

      console.log(chalk.green(`Found ${videoFiles.length} video(s) to compress.`));

      for (let file of videoFiles) {
        const inputFilePath = path.join(directory, file);
        console.log(chalk.blue(`Compressing: ${file}...`));
        
        await compressVideo(inputFilePath, directory, options.fps, options.quality, options.faststart, options.targetSizeMb, options.clearTemp);
        console.log(chalk.green(`Successfully compressed: ${file}`));
      }
    } catch (error) {
      console.log(chalk.red(`Error in program: ${error}`));
    }
  });

program.parse(process.argv);
