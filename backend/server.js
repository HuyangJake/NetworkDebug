const express = require('express');
const cors = require('cors');
const os = require('os');
const dns = require('dns');
const { promisify } = require('util');
const { exec } = require('child_process');
const net = require('net');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 获取公网IP地址
app.get('/api/ip-addresses', async (req, res) => {
  try {
    // 并行获取IPv4和IPv6，每个都有重试机制
    const [ipv4, ipv6] = await Promise.all([
      getPublicIPv4(),
      getPublicIPv6()
    ]);

    res.json({ 
      ipv4: ipv4 ? [{ address: ipv4 }] : [],
      ipv6: ipv6 ? [{ address: ipv6 }] : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 验证是否为IPv4地址
function isValidIPv4(ip) {
  if (!ip || typeof ip !== 'string') return false;
  // IPv4不应该包含冒号（IPv6的特征）
  if (ip.includes(':')) return false;
  // 简单的IPv4格式验证：4个数字段，每段0-255
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  // 验证每个段是否在0-255范围内
  const parts = ip.split('.');
  return parts.length === 4 && parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取公网IPv4地址（带重试机制）
async function getPublicIPv4() {
  const maxRetries = 3;
  const timeout = 15000; // 增加到15秒
  const retryDelay = 1000; // 重试间隔1秒

  // 主服务列表
  const primaryServices = [
    { hostname: 'api.ipify.org', path: '/?format=json', useHttps: true },
    { hostname: 'ifconfig.me', path: '/ip', useHttps: false }
  ];

  // 尝试每个服务，每个服务重试maxRetries次
  for (const service of primaryServices) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const ip = await getPublicIPv4FromService(service, timeout);
        if (ip) {
          return ip;
        }
      } catch (error) {
        // 最后一次尝试失败，继续下一个服务
        if (attempt === maxRetries - 1) {
          continue;
        }
      }
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries - 1) {
        await delay(retryDelay);
      }
    }
  }

  return null;
}

// 从指定服务获取IPv4地址
function getPublicIPv4FromService(service, timeout) {
  return new Promise((resolve, reject) => {
    const client = service.useHttps ? https : http;
    const options = {
      hostname: service.hostname,
      path: service.path,
      method: 'GET',
      timeout: timeout
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (service.path.includes('format=json')) {
            // JSON格式响应
            const result = JSON.parse(data);
            const ip = result.ip;
            if (isValidIPv4(ip)) {
              resolve(ip);
            } else {
              reject(new Error('Invalid IPv4 format'));
            }
          } else {
            // 纯文本响应
            const trimmed = data.trim();
            if (isValidIPv4(trimmed)) {
              resolve(trimmed);
            } else {
              reject(new Error('Invalid IPv4 format'));
            }
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 验证是否为IPv6地址
function isValidIPv6(ip) {
  if (!ip || typeof ip !== 'string') return false;
  // 简单的IPv6格式检查：包含冒号
  if (!ip.includes(':')) return false;
  // IPv6地址验证（支持压缩格式）
  // 匹配标准IPv6格式：xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx
  // 或压缩格式：::1, 2001::1 等
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}|::1|([0-9a-fA-F]{1,4}:)+::)$/;
  return ipv6Regex.test(ip) || ip === '::1' || (ip.includes('::') && ip.split('::').length === 2);
}

// 获取公网IPv6地址（带重试机制）
async function getPublicIPv6() {
  const maxRetries = 3;
  const timeout = 15000; // 增加到15秒
  const retryDelay = 1000; // 重试间隔1秒

  // 服务列表（IPv6服务较少，但可以添加更多）
  const services = [
    { hostname: 'api64.ipify.org', path: '/?format=json', useHttps: true },
    { hostname: 'ipv6.icanhazip.com', path: '/', useHttps: false }
  ];

  // 尝试每个服务，每个服务重试maxRetries次
  for (const service of services) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const ip = await getPublicIPv6FromService(service, timeout);
        if (ip) {
          return ip;
        }
      } catch (error) {
        // 最后一次尝试失败，继续下一个服务
        if (attempt === maxRetries - 1) {
          continue;
        }
      }
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries - 1) {
        await delay(retryDelay);
      }
    }
  }

  return null;
}

// 从指定服务获取IPv6地址
function getPublicIPv6FromService(service, timeout) {
  return new Promise((resolve, reject) => {
    const client = service.useHttps ? https : http;
    const options = {
      hostname: service.hostname,
      path: service.path,
      method: 'GET',
      timeout: timeout
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (service.path.includes('format=json')) {
            // JSON格式响应
            const result = JSON.parse(data);
            const ip = result.ip;
            if (ip && isValidIPv6(ip)) {
              resolve(ip);
            } else {
              reject(new Error('Invalid IPv6 format'));
            }
          } else {
            // 纯文本响应
            const trimmed = data.trim();
            if (isValidIPv6(trimmed)) {
              resolve(trimmed);
            } else {
              reject(new Error('Invalid IPv6 format'));
            }
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 端口扫描
app.post('/api/port-scan', async (req, res) => {
  const { host, ports, timeout = 3000 } = req.body;

  if (!host || !ports || !Array.isArray(ports)) {
    return res.status(400).json({ error: '需要提供host和ports数组' });
  }

  try {
    // 解析IP地址（如果是域名）
    let ipAddresses = [];
    const lookup = promisify(dns.lookup);
    
    try {
      const addresses = await lookup(host, { all: true });
      ipAddresses = addresses.map(addr => ({
        address: addr.address,
        family: addr.family === 4 ? 'IPv4' : 'IPv6'
      }));
    } catch (e) {
      // 如果lookup失败，可能是IP地址，直接使用
      ipAddresses = [{ address: host, family: host.includes(':') ? 'IPv6' : 'IPv4' }];
    }

  const results = [];
  const scanPromises = ports.map(port => scanPort(host, port, timeout));
  
    const scanResults = await Promise.all(scanPromises);
    results.push(...scanResults);
    
    res.json({
      host,
      ipAddresses: ipAddresses.length > 0 ? ipAddresses : [{ address: host, family: 'Unknown' }],
      timestamp: new Date().toISOString(),
      results: results.sort((a, b) => a.port - b.port)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 扫描单个端口
function scanPort(host, port, timeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startTime = Date.now();
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      const duration = Date.now() - startTime;
      socket.destroy();
      resolve({
        port,
        status: 'open',
        response: 'responded',
        duration: `${duration}ms`
      });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({
        port,
        status: 'filtered',
        response: 'no_response',
        duration: 'timeout'
      });
    });
    
    socket.on('error', (err) => {
      const duration = Date.now() - startTime;
      let status = 'closed';
      let response = 'no_response';
      
      // 根据错误类型判断端口状态
      if (err.code === 'ECONNREFUSED') {
        // 连接被拒绝，说明端口关闭但有响应
        status = 'closed';
        response = 'responded';
      } else if (err.code === 'EHOSTUNREACH' || err.code === 'ENETUNREACH') {
        // 主机不可达
        status = 'filtered';
        response = 'no_response';
      } else if (err.code === 'ETIMEDOUT') {
        // 超时
        status = 'filtered';
        response = 'no_response';
      } else {
        // 其他错误，可能是被过滤
        status = 'filtered';
        response = 'no_response';
      }
      
      resolve({
        port,
        status,
        response,
        duration: duration > 0 ? `${duration}ms` : 'error',
        errorCode: err.code
      });
    });
    
    socket.connect(port, host);
  });
}

// DNS解析
app.post('/api/dns-resolve', async (req, res) => {
  const { hostname } = req.body;

  if (!hostname) {
    return res.status(400).json({ error: '需要提供hostname' });
  }

  try {
    const resolve4 = promisify(dns.resolve4);
    const resolve6 = promisify(dns.resolve6);
    const resolveMx = promisify(dns.resolveMx);
    const resolveTxt = promisify(dns.resolveTxt);
    const resolveNs = promisify(dns.resolveNs);
    const resolveCname = promisify(dns.resolveCname);
    const lookup = promisify(dns.lookup);

    const results = {
      hostname,
      timestamp: new Date().toISOString(),
      records: {}
    };

    // A记录 (IPv4)
    try {
      results.records.A = await resolve4(hostname);
    } catch (e) {
      results.records.A = [];
    }

    // AAAA记录 (IPv6)
    try {
      results.records.AAAA = await resolve6(hostname);
    } catch (e) {
      results.records.AAAA = [];
    }

    // CNAME记录
    try {
      results.records.CNAME = await resolveCname(hostname);
    } catch (e) {
      results.records.CNAME = [];
    }

    // MX记录
    try {
      const mxRecords = await resolveMx(hostname);
      results.records.MX = mxRecords.map(mx => ({
        priority: mx.priority,
        exchange: mx.exchange
      }));
    } catch (e) {
      results.records.MX = [];
    }

    // NS记录
    try {
      results.records.NS = await resolveNs(hostname);
    } catch (e) {
      results.records.NS = [];
    }

    // TXT记录
    try {
      const txtRecords = await resolveTxt(hostname);
      results.records.TXT = txtRecords.map(txt => txt.join(''));
    } catch (e) {
      results.records.TXT = [];
    }

    // 查找所有地址
    try {
      const addresses = await lookup(hostname, { all: true });
      results.records.ALL = addresses.map(addr => ({
        address: addr.address,
        family: addr.family
      }));
    } catch (e) {
      results.records.ALL = [];
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ping
app.post('/api/ping', async (req, res) => {
  const { host, count = 4 } = req.body;

  if (!host) {
    return res.status(400).json({ error: '需要提供host' });
  }

  try {
    const isWindows = process.platform === 'win32';

    // 检测是否为IPv6地址格式（包含冒号）
    const isIPv6Address = host.includes(':');

    // 尝试DNS解析以检查是否有IPv6记录
    let hasIPv6Record = false;
    try {
      const lookup = promisify(dns.lookup);
      const addresses = await lookup(host, { all: true });
      hasIPv6Record = addresses.some(addr => addr.family === 6);
    } catch (dnsError) {
      // DNS解析失败，继续使用默认ping命令
    }

    // 决定使用哪个ping命令
    const useIPv6 = isIPv6Address || hasIPv6Record;

    let pingCommand;
    if (isWindows) {
      // Windows使用 -6 参数来ping IPv6
      pingCommand = useIPv6 
        ? `ping -6 -n ${count} ${host}`
        : `ping -n ${count} ${host}`;
    } else {
      // Unix/Linux/macOS使用ping6命令来ping IPv6
      pingCommand = useIPv6 
        ? `ping6 -c ${count} ${host}`
        : `ping -c ${count} ${host}`;
    }

    exec(pingCommand, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        // ping6 在某些情况下即使有输出也会返回非零退出码
        // 如果 stdout 有内容，我们仍然返回结果
        if (stdout && stdout.trim().length > 0) {
          return res.json({
            host,
            count,
            timestamp: new Date().toISOString(),
            output: stdout,
            raw: stdout,
            warning: '命令执行完成但返回了非零退出码'
          });
        }
        
        return res.status(500).json({ 
          error: error.message,
          output: stderr || stdout,
          code: error.code
        });
      }

      res.json({
        host,
        count,
        timestamp: new Date().toISOString(),
        output: stdout,
        raw: stdout
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MTR
app.post('/api/mtr', async (req, res) => {
  const { host, count = 10 } = req.body;

  if (!host) {
    return res.status(400).json({ error: '需要提供host' });
  }

  try {
    // 检查系统是否安装了mtr
    exec('which mtr', (err) => {
      if (err) {
        return res.status(500).json({ 
          error: '系统未安装mtr工具，请先安装mtr',
          hint: 'macOS: brew install mtr, Linux: apt-get install mtr-tiny'
        });
      }

      const mtrCommand = `mtr --report --report-cycles ${count} ${host}`;
      
      exec(mtrCommand, { timeout: 60000 }, (error, stdout, stderr) => {
        if (error) {
          return res.status(500).json({ 
            error: error.message,
            output: stderr || stdout 
          });
        }

        res.json({
          host,
          count,
          timestamp: new Date().toISOString(),
          output: stdout,
          raw: stdout
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 诊断HTTP连接失败原因
async function diagnoseHttpFailure(hostname, port, isHttps) {
  const diagnosis = {
    dns: null,
    ping: null,
    portScan: null,
    analysis: [],
    recommendations: []
  };

  try {
    // 1. DNS解析
    try {
      const lookup = promisify(dns.lookup);
      const addresses = await lookup(hostname, { all: true });
      diagnosis.dns = {
        success: true,
        addresses: addresses.map(addr => ({
          address: addr.address,
          family: addr.family === 4 ? 'IPv4' : 'IPv6'
        }))
      };
    } catch (e) {
      diagnosis.dns = {
        success: false,
        error: e.message
      };
      diagnosis.analysis.push('DNS解析失败：无法将域名解析为IP地址');
      diagnosis.recommendations.push('检查域名是否正确，或DNS服务器是否可访问');
      return diagnosis; // DNS失败，无需继续
    }

    // 2. Ping测试
    try {
      const isWindows = process.platform === 'win32';
      
      // 检查是否有IPv6地址
      const hasIPv6 = diagnosis.dns.addresses.some(addr => addr.family === 'IPv6');
      const isIPv6Address = hostname.includes(':');
      const useIPv6 = isIPv6Address || hasIPv6;
      
      let pingCommand;
      if (isWindows) {
        pingCommand = useIPv6 ? `ping -6 -n 2 ${hostname}` : `ping -n 2 ${hostname}`;
      } else {
        pingCommand = useIPv6 ? `ping6 -c 2 ${hostname}` : `ping -c 2 ${hostname}`;
      }
      
      await new Promise((resolve, reject) => {
        exec(pingCommand, { timeout: 10000 }, (error, stdout) => {
          if (error && error.code !== 0) {
            // 即使有错误，如果stdout有内容，可能仍然成功
            if (stdout && stdout.trim().length > 0) {
              diagnosis.ping = {
                success: true,
                output: stdout
              };
            } else {
              diagnosis.ping = {
                success: false,
                error: 'Ping失败',
                output: stdout
              };
              diagnosis.analysis.push('网络连通性测试失败：无法ping通目标主机');
              diagnosis.recommendations.push('目标主机可能不在线，或网络路由有问题');
            }
          } else {
            diagnosis.ping = {
              success: true,
              output: stdout
            };
          }
          resolve();
        });
      });
    } catch (e) {
      diagnosis.ping = {
        success: false,
        error: e.message
      };
    }

    // 3. 端口扫描
    try {
      const portResult = await scanPort(hostname, port, 5000);
      diagnosis.portScan = {
        port: port,
        status: portResult.status,
        response: portResult.response,
        duration: portResult.duration,
        errorCode: portResult.errorCode
      };

      if (portResult.status === 'filtered' && portResult.response === 'no_response') {
        diagnosis.analysis.push(`端口${port}被过滤或无响应：可能被防火墙阻止`);
        diagnosis.recommendations.push('检查防火墙设置，确认端口是否开放');
      } else if (portResult.status === 'closed' && portResult.response === 'responded') {
        diagnosis.analysis.push(`端口${port}已关闭：端口存在但没有服务监听`);
        diagnosis.recommendations.push('确认目标服务是否正在运行');
      } else if (portResult.status === 'open') {
        diagnosis.analysis.push(`端口${port}已开放：端口可以连接，但HTTP/HTTPS协议层可能有问题`);
        diagnosis.recommendations.push('检查SSL证书（HTTPS）或HTTP服务配置');
      }
    } catch (e) {
      diagnosis.portScan = {
        error: e.message
      };
    }

    // 综合分析（避免重复）
    if (diagnosis.ping && !diagnosis.ping.success && 
        !diagnosis.analysis.some(a => a.includes('网络连通性测试失败'))) {
      diagnosis.analysis.push('主机不可达：网络层连接失败');
      if (!diagnosis.recommendations.some(r => r.includes('网络连接'))) {
        diagnosis.recommendations.push('检查网络连接、路由配置或目标主机是否在线');
      }
    } else if (diagnosis.portScan && diagnosis.portScan.status === 'open' &&
               !diagnosis.analysis.some(a => a.includes('端口已开放但HTTP'))) {
      diagnosis.analysis.push('端口开放但HTTP/HTTPS连接失败：可能是协议层问题');
      if (!diagnosis.recommendations.some(r => r.includes('SSL/TLS'))) {
        diagnosis.recommendations.push('检查SSL/TLS配置、证书有效性或HTTP服务状态');
      }
    } else if (diagnosis.portScan && diagnosis.portScan.status === 'filtered' &&
               !diagnosis.analysis.some(a => a.includes('端口被过滤'))) {
      diagnosis.analysis.push('端口被过滤：防火墙或安全策略阻止了连接');
      if (!diagnosis.recommendations.some(r => r.includes('防火墙规则'))) {
        diagnosis.recommendations.push('检查防火墙规则、安全组配置或网络ACL');
      }
    }

  } catch (error) {
    diagnosis.error = error.message;
  }

  return diagnosis;
}

// HTTP/HTTPS连接测试
app.post('/api/http-test', async (req, res) => {
  const { url, method = 'GET', timeout = 10000, followRedirects = true, autoDiagnose = true } = req.body;

  if (!url) {
    return res.status(400).json({ error: '需要提供URL' });
  }

  try {
    const testUrl = new URL(url);
    const isHttps = testUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    const startTime = Date.now();
    const targetPort = testUrl.port || (isHttps ? 443 : 80);

    const options = {
      hostname: testUrl.hostname,
      port: targetPort,
      path: testUrl.pathname + testUrl.search,
      method: method.toUpperCase(),
      timeout: timeout,
      headers: {
        'User-Agent': 'NetworkDebug-Tool/1.0'
      }
    };

    const makeRequest = (requestOptions, requestClient, redirectCount = 0, originalUrl = url) => {
      return new Promise((resolve, reject) => {
        const req = requestClient.request(requestOptions, (response) => {
          const responseTime = Date.now() - startTime;
          let data = '';

          response.on('data', (chunk) => {
            data += chunk.toString();
          });

          response.on('end', () => {
            let finalUrl = originalUrl;
            if (redirectCount > 0) {
              const protocol = requestClient === https ? 'https' : 'http';
              const port = requestOptions.port && 
                          requestOptions.port !== (protocol === 'https' ? 443 : 80) 
                          ? `:${requestOptions.port}` : '';
              finalUrl = `${protocol}://${requestOptions.hostname}${port}${requestOptions.path}`;
            }
            
            const result = {
              url: originalUrl,
              statusCode: response.statusCode,
              statusMessage: response.statusMessage,
              headers: response.headers,
              responseTime: `${responseTime}ms`,
              success: response.statusCode >= 200 && response.statusCode < 400,
              redirectCount: redirectCount,
              finalUrl: finalUrl
            };

            // 处理重定向
            if (followRedirects && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
              if (redirectCount >= 5) {
                result.error = '重定向次数过多（超过5次）';
                resolve(result);
                return;
              }

              try {
                const redirectUrl = new URL(response.headers.location, originalUrl);
                const redirectOptions = {
                  hostname: redirectUrl.hostname,
                  port: redirectUrl.port || (redirectUrl.protocol === 'https:' ? 443 : 80),
                  path: redirectUrl.pathname + redirectUrl.search,
                  method: method.toUpperCase(),
                  timeout: timeout,
                  headers: {
                    'User-Agent': 'NetworkDebug-Tool/1.0'
                  }
                };
                const redirectClient = redirectUrl.protocol === 'https:' ? https : http;
                
                makeRequest(redirectOptions, redirectClient, redirectCount + 1, originalUrl).then(resolve).catch(reject);
              } catch (e) {
                result.error = `重定向URL解析失败: ${e.message}`;
                resolve(result);
              }
            } else {
              resolve(result);
            }
          });
        });

        req.on('error', (error) => {
          const responseTime = Date.now() - startTime;
          resolve({
            url: originalUrl,
            success: false,
            error: error.message,
            errorCode: error.code,
            responseTime: `${responseTime}ms`
          });
        });

        req.on('timeout', () => {
          req.destroy();
          const responseTime = Date.now() - startTime;
          resolve({
            url: originalUrl,
            success: false,
            error: '请求超时',
            responseTime: `${responseTime}ms`
          });
        });

        req.setTimeout(timeout);
        req.end();
      });
    };

    const result = await makeRequest(options, client);
    
    // 如果失败且启用自动诊断，执行诊断
    if (!result.success && autoDiagnose) {
      result.diagnosis = await diagnoseHttpFailure(testUrl.hostname, targetPort, isHttps);
    }
    
    res.json(result);
  } catch (error) {
    const errorResult = {
      url: url,
      success: false,
      error: error.message
    };
    
    // 如果URL解析失败，尝试诊断
    if (autoDiagnose && error.message.includes('Invalid URL')) {
      try {
        const testUrl = new URL(url);
        errorResult.diagnosis = await diagnoseHttpFailure(testUrl.hostname, testUrl.port || (testUrl.protocol === 'https:' ? 443 : 80), testUrl.protocol === 'https:');
      } catch (e) {
        // 忽略诊断错误
      }
    }
    
    res.status(500).json(errorResult);
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

