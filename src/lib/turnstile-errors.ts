const ERROR_MESSAGES: Record<string, string> = {
  // Generic widget error codes
  '600000': '人机验证失败，请重试。',
  '600001': '人机验证失败，请重试。',
  '600002': '人机验证失败，请重试。',
  '600003': '人机验证失败，请重试。',
  '600010': '人机验证会话已失效，请重新验证。',
  'timeout-or-duplicate': '人机验证已超时或已被使用，请重新完成验证。',
  'internal-error': '人机验证服务出现问题，请稍后再试。',
};

const DEFAULT_ERROR_MESSAGE = '人机验证失败，请重试。';

export function getTurnstileErrorMessage(reason?: unknown): string {
  if (typeof reason === 'string') {
    const normalized = reason.trim();
    if (ERROR_MESSAGES[normalized]) {
      return ERROR_MESSAGES[normalized];
    }
  }

  if (typeof reason === 'object' && reason !== null) {
    try {
      const stringified = JSON.stringify(reason);
      if (stringified && ERROR_MESSAGES[stringified]) {
        return ERROR_MESSAGES[stringified];
      }
    } catch {}
  }

  return DEFAULT_ERROR_MESSAGE;
}
