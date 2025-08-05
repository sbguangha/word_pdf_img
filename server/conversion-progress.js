const EventEmitter = require('events');

/**
 * 实时转换进度管理器
 * 提供进度事件、错误处理和用户反馈
 */

class ConversionProgress extends EventEmitter {
  constructor() {
    super();
    this.activeConversions = new Map();
  }

  startConversion(conversionId, fileName, totalPages) {
    const conversion = {
      id: conversionId,
      fileName,
      totalPages,
      currentPage: 0,
      status: 'starting',
      startTime: Date.now(),
      strategy: null,
      errors: [],
      warnings: []
    };

    this.activeConversions.set(conversionId, conversion);
    
    this.emit('conversion:start', {
      id: conversionId,
      fileName,
      totalPages,
      startTime: conversion.startTime
    });

    return conversionId;
  }

  updateProgress(conversionId, page, strategy, status = 'processing') {
    const conversion = this.activeConversions.get(conversionId);
    if (!conversion) return;

    conversion.currentPage = page;
    conversion.strategy = strategy;
    conversion.status = status;

    const progress = {
      id: conversionId,
      currentPage: page,
      totalPages: conversion.totalPages,
      percentage: Math.round((page / conversion.totalPages) * 100),
      strategy,
      status,
      elapsedTime: Date.now() - conversion.startTime
    };

    this.emit('conversion:progress', progress);
  }

  completeConversion(conversionId, result) {
    const conversion = this.activeConversions.get(conversionId);
    if (!conversion) return;

    conversion.status = 'completed';
    conversion.endTime = Date.now();
    conversion.duration = conversion.endTime - conversion.startTime;
    conversion.result = result;

    this.emit('conversion:complete', {
      id: conversionId,
      fileName: conversion.fileName,
      duration: conversion.duration,
      strategy: conversion.strategy,
      pages: result.pages,
      files: result.files
    });

    // 清理转换记录（延迟10分钟）
    setTimeout(() => {
      this.activeConversions.delete(conversionId);
    }, 10 * 60 * 1000);

    return conversion;
  }

  failConversion(conversionId, error, strategy) {
    const conversion = this.activeConversions.get(conversionId);
    if (!conversion) return;

    conversion.status = 'failed';
    conversion.endTime = Date.now();
    conversion.duration = conversion.endTime - conversion.startTime;
    conversion.errors.push({
      message: error.message,
      strategy,
      timestamp: new Date().toISOString()
    });

    this.emit('conversion:error', {
      id: conversionId,
      fileName: conversion.fileName,
      error: error.message,
      strategy,
      duration: conversion.duration
    });

    return conversion;
  }

  addWarning(conversionId, warning) {
    const conversion = this.activeConversions.get(conversionId);
    if (conversion) {
      conversion.warnings.push({
        message: warning,
        timestamp: new Date().toISOString()
      });

      this.emit('conversion:warning', {
        id: conversionId,
        warning
      });
    }
  }

  getActiveConversions() {
    return Array.from(this.activeConversions.values());
  }

  getConversionStatus(conversionId) {
    return this.activeConversions.get(conversionId);
  }

  // 生成详细的进度报告
  generateReport(conversionId) {
    const conversion = this.activeConversions.get(conversionId);
    if (!conversion) return null;

    return {
      id: conversion.id,
      fileName: conversion.fileName,
      status: conversion.status,
      progress: conversion.totalPages > 0 ? Math.round((conversion.currentPage / conversion.totalPages) * 100) : 0,
      currentPage: conversion.currentPage,
      totalPages: conversion.totalPages,
      strategy: conversion.strategy,
      duration: conversion.status !== 'starting' ? Date.now() - conversion.startTime : 0,
      errors: conversion.errors,
      warnings: conversion.warnings,
      startTime: conversion.startTime,
      endTime: conversion.endTime
    };
  }

  // 清理所有完成的转换记录
  cleanup() {
    const now = Date.now();
    for (const [id, conversion] of this.activeConversions.entries()) {
      if (conversion.status === 'completed' || conversion.status === 'failed') {
        if (now - conversion.endTime > 30 * 60 * 1000) { // 30分钟后清理
          this.activeConversions.delete(id);
        }
      }
    }
  }

  // 获取系统统计信息
  getStats() {
    const conversions = Array.from(this.activeConversions.values());
    const completed = conversions.filter(c => c.status === 'completed');
    const failed = conversions.filter(c => c.status === 'failed');
    const processing = conversions.filter(c => c.status === 'processing');

    return {
      total: conversions.length,
      completed: completed.length,
      failed: failed.length,
      processing: processing.length,
      averageDuration: completed.length > 0 
        ? completed.reduce((sum, c) => sum + c.duration, 0) / completed.length 
        : 0
    };
  }
}

// 错误处理增强
class ConversionError extends Error {
  constructor(message, code, strategy, details = {}) {
    super(message);
    this.name = 'ConversionError';
    this.code = code;
    this.strategy = strategy;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

const ErrorCodes = {
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_FORMAT: 'INVALID_FORMAT',
  MEMORY_LIMIT: 'MEMORY_LIMIT',
  TIMEOUT: 'TIMEOUT',
  CORRUPTED_PDF: 'CORRUPTED_PDF',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNKNOWN: 'UNKNOWN'
};

module.exports = {
  ConversionProgress,
  ConversionError,
  ErrorCodes
};