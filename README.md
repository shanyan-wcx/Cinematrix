# Cinematrix

毕业设计 - 影视资源搜索整理系统

------

# 安装

首先，克隆该项目：

```bash
git clone https://github.com/shanyan-wcx/Cinematrix.git
```

接着，进入项目文件夹：

```bash
cd Cinematrix
```

然后，安装所需依赖：

```bash
npm install
```

最后，启动程序：

```bash
npm start
```

现在，服务已经运行在<http://localhost:3000>，请在浏览器中打开该地址。

# 配置

配置清单如下：

```json
{
    "MyAPIFilms_token": "",
    "assrt_token": "",
    "qb_host": "",
    "qb_username": "",
    "qb_password": "",
    "qb_savepath": "/未分类",
    "qb_category": "/未分类",
    "qb_tags": "Cinematrix"
}
```

可以在网页中配置，也可以直接修改配置文件。其中，`MyAPIFilms_token`、`assrt_token`和`qb_host`为必需选项。

`MyAPIFilms_token`请到[MyAPIFilms](https://www.myapifilms.com/)获取。

`assrt_token`请到[Assrt.net](https://assrt.net/)获取。

`qb_host`为本地qBittorrent地址。

# 下载

:::info
注意：当前仅支持使用本地qBittorrent作为下载器。

:::

启动Cinematrix前，应当先打开qBittorrent，并在设置中启用Web UI功能。若启用了Web UI登陆验证，需在启动Cinematrix后转到设置页配置qBittorrent用户名和密码。
