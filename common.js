export const allDomains = new Set()
export const allLinks = new Set()
export const newUrls = []

export const config = {
  // 要下载的目标网站
  site: 'https://www.example.com/',
  // 允许关联下载哪些域名，正则表达式匹配
  host_pattern: /example/,

  // 下载文件保存到哪里
  dirname: './site',
  // 日志保存到哪里
  log_path: './log.log',
  // 并发量
  concurrency: 20,
  // 请求延时
  timeout: 60e3,
  // 下载延时
  download_timeout: 1200e3,
  // 同一个请求的尝试次数
  num_retries: 3,
  // 深入检测，比如 js 脚本里动态添加的资源链接
  deep_detect: true,
  // 日志控制
  logger: {
    // 控制台日志关闭，默认是开启
    // console: false,
    // file: false
  },
  // 正则匹配
  patterns: {
    // html 网址的后缀类型
    html_ext: /(html|htm|xhtml|shtml|dhtml|php|phtml|jsp|asp|aspx|do|action)/i,
    // html 代码里检测关联网址
    html_url: [
      [/(href|src)=(["'])([^"']*)/g, 3],
      [/(href|src)=([^"'\s>]+)(\s|>)/g, 2],
      [/<meta\s+http-equiv="refresh"\s+content="[^(url)]*url="?([^"]+)"?>/gi, 1]
    ],
    // css 代码里检测关联网址
    css_url: [
      [/url\((["'])([^"']*)/g, 2]
    ],
    // 深入检测动态链接的正则
    js_url: [
      [/\"([^"]+\.(js|css|html|png|jpg|svg|jpeg|gif|webp|ttf|woff|woff2|eot|php|jsp|asp|aspx|pdf|exe|zip|rar|mp3|mp4|txt|doc|docx|xls|xlsx|ppt|pptx))\"/gi, 1],
      [/\'([^']+\.(js|css|html|png|jpg|svg|jpeg|gif|webp|ttf|woff|woff2|eot|php|jsp|asp|aspx|pdf|exe|zip|rar|mp3|mp4|txt|doc|docx|xls|xlsx|ppt|pptx))\'/gi, 1]
    ]
  },
  // 自定义请求头
  headers: {
    'accept': 'application/json, text/plain, */*',
    'connection': 'keep-alive',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  }
}
