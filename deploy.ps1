# 环境管理器 Docker 部署脚本 (PowerShell)
# 使用方法: .\deploy.ps1 [选项]

param(
    [switch]$Help,
    [switch]$Cleanup,
    [switch]$Build,
    [switch]$Start
)

# 颜色定义
function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 检查必需的文件
function Test-Requirements {
    Write-ColorMessage "🔍 检查部署要求..." "Blue"
    
    # 检查 Docker
    try {
        docker --version | Out-Null
    }
    catch {
        Write-ColorMessage "❌ Docker 未安装，请先安装 Docker Desktop" "Red"
        exit 1
    }
    
    # 检查 Docker Compose
    try {
        docker-compose --version | Out-Null
    }
    catch {
        try {
            docker compose version | Out-Null
        }
        catch {
            Write-ColorMessage "❌ Docker Compose 未安装，请先安装 Docker Compose" "Red"
            exit 1
        }
    }
    
    # 检查环境变量文件
    if (-not (Test-Path ".env.local")) {
        Write-ColorMessage "⚠️  未找到 .env.local 文件" "Yellow"
        Write-ColorMessage "📋 正在创建环境变量模板..." "Blue"
        Copy-Item ".env.docker.example" ".env.local"
        Write-ColorMessage "⚠️  请编辑 .env.local 文件并填写必要的配置" "Yellow"
        Write-ColorMessage "📝 主要需要配置：" "Blue"
        Write-Host "   - NOTION_API_KEY: Notion API 密钥"
        Write-Host "   - NOTION_DATABASE_ID: Notion 数据库 ID"
        Read-Host "配置完成后按 Enter 继续"
    }
    
    Write-ColorMessage "✅ 部署要求检查完成" "Green"
}

# 构建 Docker 镜像
function Build-Image {
    Write-ColorMessage "🏗️  构建 Docker 镜像..." "Blue"
    
    # 使用 Docker Compose 构建
    try {
        docker-compose build --no-cache
    }
    catch {
        docker compose build --no-cache
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorMessage "❌ Docker 镜像构建失败" "Red"
        exit 1
    }
    
    Write-ColorMessage "✅ Docker 镜像构建完成" "Green"
}

# 启动服务
function Start-Services {
    Write-ColorMessage "🚀 启动服务..." "Blue"
    
    # 停止现有服务
    try {
        docker-compose down
        docker-compose up -d
    }
    catch {
        docker compose down
        docker compose up -d
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorMessage "❌ 服务启动失败" "Red"
        exit 1
    }
    
    Write-ColorMessage "✅ 服务启动完成" "Green"
}

# 检查服务状态
function Test-Health {
    Write-ColorMessage "🏥 检查服务健康状态..." "Blue"
    
    # 等待服务启动
    Start-Sleep -Seconds 10
    
    # 检查容器状态
    try {
        docker-compose ps
    }
    catch {
        docker compose ps
    }
    
    # 检查健康状态
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-ColorMessage "✅ 服务健康检查通过" "Green"
                break
            }
        }
        catch {
            Write-ColorMessage "⏳ 等待服务启动... ($attempt/$maxAttempts)" "Yellow"
            Start-Sleep -Seconds 5
            $attempt++
        }
    }
    
    if ($attempt -gt $maxAttempts) {
        Write-ColorMessage "❌ 服务健康检查失败" "Red"
        Write-ColorMessage "📋 查看日志:" "Blue"
        try {
            docker-compose logs --tail=50
        }
        catch {
            docker compose logs --tail=50
        }
        exit 1
    }
}

# 显示部署信息
function Show-Info {
    Write-ColorMessage "🎉 部署完成！" "Green"
    Write-Host ""
    Write-ColorMessage "📋 服务信息:" "Blue"
    Write-Host "   🌐 应用地址: http://localhost:3000"
    Write-Host "   🏥 健康检查: http://localhost:3000/api/health"
    Write-Host "   🐛 调试工具: http://localhost:3000/debug"
    Write-Host ""
    Write-ColorMessage "📋 管理命令:" "Blue"
    Write-Host "   查看日志: docker-compose logs -f"
    Write-Host "   停止服务: docker-compose down"
    Write-Host "   重启服务: docker-compose restart"
    Write-Host "   查看状态: docker-compose ps"
    Write-Host ""
    Write-ColorMessage "📁 数据持久化:" "Blue"
    Write-Host "   浏览器会话数据保存在 Docker volume 中"
    Write-Host "   日志文件保存在 .\logs 目录中"
}

# 清理函数
function Invoke-Cleanup {
    Write-ColorMessage "🧹 清理 Docker 资源..." "Blue"
    
    try {
        docker-compose down
    }
    catch {
        docker compose down
    }
    
    # 清理未使用的镜像
    docker image prune -f
    
    Write-ColorMessage "✅ 清理完成" "Green"
}

# 显示帮助信息
function Show-Help {
    Write-Host "环境管理器 Docker 部署脚本"
    Write-Host ""
    Write-Host "使用方法:"
    Write-Host "  .\deploy.ps1 [选项]"
    Write-Host ""
    Write-Host "选项:"
    Write-Host "  -Help      显示帮助信息"
    Write-Host "  -Cleanup   清理 Docker 资源"
    Write-Host "  -Build     仅构建镜像"
    Write-Host "  -Start     仅启动服务"
    Write-Host ""
    Write-Host "示例:"
    Write-Host "  .\deploy.ps1           # 完整部署"
    Write-Host "  .\deploy.ps1 -Build    # 仅构建镜像"
    Write-Host "  .\deploy.ps1 -Cleanup  # 清理资源"
}

# 主函数
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    if ($Cleanup) {
        Invoke-Cleanup
        return
    }
    
    if ($Build) {
        Test-Requirements
        Build-Image
        return
    }
    
    if ($Start) {
        Start-Services
        Test-Health
        Show-Info
        return
    }
    
    # 完整部署流程
    Test-Requirements
    Build-Image
    Start-Services
    Test-Health
    Show-Info
}

# 执行主函数
Main
