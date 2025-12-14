const express = require('express');
const cors = require('cors');
const os = require('os');
const dns = require('dns');
const { promisify } = require('util');
const { exec } = require('child_process');
const net = require('net');
const https = require('https');
const http = require('http');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 获取公网IP地址
app.get('/api/ip-addresses', async (req, res) => {
  try {
    const ipv4 = await getPublicIPv4();
    const ipv6 = await getPublicIPv6();

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

// 获取公网IPv4地址
function getPublicIPv4() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.ipify.org',
      path: '/?format=json',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const ip = result.ip;
          // 验证返回的IP是否为IPv4
          if (isValidIPv4(ip)) {
            resolve(ip);
          } else {
            // 如果不是IPv4，尝试备用服务
            getPublicIPv4Fallback().then(resolve).catch(() => resolve(null));
          }
        } catch (e) {
          // 如果解析失败，尝试直接返回数据
          const trimmed = data.trim();
          if (isValidIPv4(trimmed)) {
            resolve(trimmed);
          } else {
            // 如果不是IPv4，尝试备用服务
            getPublicIPv4Fallback().then(resolve).catch(() => resolve(null));
          }
        }
      });
    });

    req.on('error', (error) => {
      // 如果第一个服务失败，尝试备用服务
      getPublicIPv4Fallback().then(resolve).catch(() => resolve(null));
    });

    req.on('timeout', () => {
      req.destroy();
      getPublicIPv4Fallback().then(resolve).catch(() => resolve(null));
    });

    req.end();
  });
}

// 获取公网IPv4备用方法
function getPublicIPv4Fallback() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ifconfig.me',
      path: '/ip',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const trimmed = data.trim();
        // 验证返回的IP是否为IPv4，如果不是则返回null
        if (isValidIPv4(trimmed)) {
          resolve(trimmed);
        } else {
          resolve(null);
        }
      });
    });

    req.on('error', () => {
      resolve(null);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

// 获取公网IPv6地址
function getPublicIPv6() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api64.ipify.org',
      path: '/?format=json',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const ip = result.ip;
          // 检查是否是IPv6地址
          if (ip && ip.includes(':')) {
            resolve(ip);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => {
      resolve(null);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(null);
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
    const pingCommand = isWindows 
      ? `ping -n ${count} ${host}`
      : `ping -c ${count} ${host}`;

    exec(pingCommand, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error && error.code !== 0) {
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

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

