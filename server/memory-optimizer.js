const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 内存和文件管理优化器
 * 智能清理和内存监控
 */

class MemoryOptimizer {
  constructor() {
    this.tempDirs = [
      path.join(__dirname, 'uploads'),
      path.join(__dirname, 'outputs'),
      path.join(__dirname, '../temp')
    ];
    
    this.config = {
      maxFileAge: 30 * 60 * 1000, // 30分钟
      maxTempSize: 500 * 1024 * 1024, // 500MB
      cleanupInterval: 10 * 60 * 1000, // 10分钟
      memoryThreshold: 0.8 // 80%内存使用率
    };

    this.startCleanupScheduler();
  }

  // 智能文件清理
  async cleanupOldFiles() {
    const now = Date.now();
    let totalCleaned = 0;

    for (const dir of this.tempDirs) {
      if (!fs.existsSync(dir)) continue;

      try {
        const files = fs.readdirSync(dir);
        let cleanedInDir = 0;

        for (const file of files) {
          const filePath = path.join(dir, file);
          
          try {
            const stats = fs.statSync(filePath);
            const age = now - stats.mtime.getTime();

            // 清理超过30分钟的文件
            if (age > this.config.maxFileAge) {
              fs.unlinkSync(filePath);
              cleanedInDir++;
              totalCleaned++;
            }
          } catch (error) {
            console.warn(`无法清理文件 ${filePath}:`, error.message);
          }
        }

        if (cleanedInDir > 0) {
          console.log(`🧹 清理 ${dir}: ${cleanedInDir}个文件`);
        }
      } catch (error) {
        console.warn(`无法访问目录 ${dir}:`, error.message);
      }
    }

    return totalCleaned;
  }

  // 内存压力监控
  getMemoryUsage() {
    const usage = process.memoryUsage();
    const total = os.totalmem();
    const free = os.freemem();
    
    return {
      process: {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external
      },
      system: {
        total,
        free,
        used: total - free,
        usage: (total - free) / total
      }
    };
  }

  // 检查是否需要紧急清理
  shouldForceCleanup() {
    const memory = this.getMemoryUsage();
    return memory.system.usage > this.config.memoryThreshold;
  }

  // 清理大文件
  async cleanupLargeFiles() {
    const now = Date.now();
    let totalSize = 0;
    let cleanedFiles = 0;

    for (const dir of this.tempDirs) {
      if (!fs.existsSync(dir)) continue;

      try {
        const files = fs.readdirSync(dir);
        let dirSize = 0;

        for (const file of files) {
          const filePath = path.join(dir, file);
          
          try {
            const stats = fs.statSync(filePath);
            dirSize += stats.size;
            
            // 如果目录总大小超过阈值，清理最老的文件
            if (dirSize > this.config.maxTempSize) {
              const age = now - stats.mtime.getTime();
              if (age > 5 * 60 * 1000) { // 5分钟以上
                fs.unlinkSync(filePath);
                totalSize += stats.size;
                cleanedFiles++;
              }
            }
          } catch (error) {
            console.warn(`无法处理文件 ${filePath}:`, error.message);
          }
        }
      } catch (error) {
        console.warn(`无法访问目录 ${dir}:`, error.message);
      }
    }

    if (cleanedFiles > 0) {
      console.log(`🗑️ 清理大文件: ${cleanedFiles}个, ${Math.round(totalSize/1024/1024)}MB`);
    }

    return { files: cleanedFiles, size: totalSize };
  }

  // 启动定时清理
  startCleanupScheduler() {
    setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error('清理任务失败:', error.message);
      }
    }, this.config.cleanupInterval);

    // 紧急清理监听器
    setInterval(() => {
      if (this.shouldForceCleanup()) {
        console.log('⚠️ 内存压力过高，执行紧急清理');
        this.cleanupLargeFiles();
      }
    }, 30 * 1000); // 每30秒检查一次
  }

  // 执行完整清理
  async performCleanup() {
    const memoryBefore = this.getMemoryUsage();
    
    console.log('🧹 开始系统清理...');
    console.log(`   内存使用: ${Math.round(memoryBefore.system.usage * 100)}%`);
    
    const oldFiles = await this.cleanupOldFiles();
    const largeFiles = await this.cleanupLargeFiles();
    
    const memoryAfter = this.getMemoryUsage();
    
    console.log(`   清理结果: ${oldFiles + largeFiles.files}个文件, ${Math.round(largeFiles.size/1024/1024)}MB`);
    console.log(`   内存改善: ${Math.round((memoryBefore.system.usage - memoryAfter.system.usage) * 100)}%`);
  }

  // 获取清理统计
  getCleanupStats() {
    let totalFiles = 0;
    let totalSize = 0;

    for (const dir of this.tempDirs) {
      if (!fs.existsSync(dir)) continue;

      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          totalFiles++;
          totalSize += stats.size;
        }
      } catch (error) {
        console.warn(`无法统计目录 ${dir}:`, error.message);
      }
    }

    return {
      directories: this.tempDirs,
      totalFiles,
      totalSize: totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024)
    };
  }

  // 手动清理指定文件
  async cleanupSpecificFiles(filePaths) {
    let cleaned = 0;
    let totalSize = 0;

    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          fs.unlinkSync(filePath);
          cleaned++;
          totalSize += stats.size;
        }
      } catch (error) {
        console.warn(`无法清理文件 ${filePath}:`, error.message);
      }
    }

    return { files: cleaned, size: totalSize };
  }

  // 创建内存使用报告
  generateMemoryReport() {
    const memory = this.getMemoryUsage();
    const stats = this.getCleanupStats();
    
    return {
      timestamp: new Date().toISOString(),
      memory: memory,
      files: stats,
      recommendations: this.generateRecommendations(memory, stats)
    };
  }

  generateRecommendations(memory, stats) {
    const recommendations = [];
    
    if (memory.system.usage > 0.9) {
      recommendations.push('系统内存使用率过高，建议立即清理');
    }
    
    if (stats.totalSizeMB > 100) {
      recommendations.push('临时文件超过100MB，建议清理');
    }
    
    if (stats.totalFiles > 50) {
      recommendations.push('临时文件数量过多，建议清理');
    }

    if (recommendations.length === 0) {
      recommendations.push('系统运行正常，无需特别处理');
    }

    return recommendations;
  }

  // 清理所有临时文件
  async cleanupAll() {
    let totalFiles = 0;
    let totalSize = 0;

    for (const dir of this.tempDirs) {
      if (!fs.existsSync(dir)) continue;

      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          fs.unlinkSync(filePath);
          totalFiles++;
          totalSize += stats.size;
        }
      } catch (error) {
        console.warn(`无法清理目录 ${dir}:`, error.message);
      }
    }

    console.log(`🧹 完全清理: ${totalFiles}个文件, ${Math.round(totalSize/1024/1024)}MB`);
    return { files: totalFiles, size: totalSize };
  }
}

module.exports = MemoryOptimizer;