#!/bin/bash

# 环境管理器 Docker 部署脚本
# 使用方法: ./deploy.sh [选项]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查必需的文件
check_requirements() {
    print_message $BLUE "🔍 检查部署要求..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        print_message $RED "❌ Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_message $RED "❌ Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    # 检查环境变量文件
    if [ ! -f ".env.local" ]; then
        print_message $YELLOW "⚠️  未找到 .env.local 文件"
        print_message $BLUE "📋 正在创建环境变量模板..."
        cp .env.docker.example .env.local
        print_message $YELLOW "⚠️  请编辑 .env.local 文件并填写必要的配置"
        print_message $BLUE "📝 主要需要配置："
        echo "   - NOTION_API_KEY: Notion API 密钥"
        echo "   - NOTION_DATABASE_ID: Notion 数据库 ID"
        read -p "配置完成后按 Enter 继续..."
    fi
    
    print_message $GREEN "✅ 部署要求检查完成"
}

# 构建 Docker 镜像
build_image() {
    print_message $BLUE "🏗️  构建 Docker 镜像..."
    
    # 使用 Docker Compose 构建
    if command -v docker-compose &> /dev/null; then
        docker-compose build --no-cache
    else
        docker compose build --no-cache
    fi
    
    print_message $GREEN "✅ Docker 镜像构建完成"
}

# 启动服务
start_services() {
    print_message $BLUE "🚀 启动服务..."
    
    # 停止现有服务
    if command -v docker-compose &> /dev/null; then
        docker-compose down
        docker-compose up -d
    else
        docker compose down
        docker compose up -d
    fi
    
    print_message $GREEN "✅ 服务启动完成"
}

# 检查服务状态
check_health() {
    print_message $BLUE "🏥 检查服务健康状态..."
    
    # 等待服务启动
    sleep 10
    
    # 检查容器状态
    if command -v docker-compose &> /dev/null; then
        docker-compose ps
    else
        docker compose ps
    fi
    
    # 检查健康状态
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            print_message $GREEN "✅ 服务健康检查通过"
            break
        else
            print_message $YELLOW "⏳ 等待服务启动... ($attempt/$max_attempts)"
            sleep 5
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_message $RED "❌ 服务健康检查失败"
        print_message $BLUE "📋 查看日志:"
        if command -v docker-compose &> /dev/null; then
            docker-compose logs --tail=50
        else
            docker compose logs --tail=50
        fi
        exit 1
    fi
}

# 显示部署信息
show_info() {
    print_message $GREEN "🎉 部署完成！"
    echo ""
    print_message $BLUE "📋 服务信息:"
    echo "   🌐 应用地址: http://localhost:3000"
    echo "   🏥 健康检查: http://localhost:3000/api/health"
    echo "   🐛 调试工具: http://localhost:3000/debug"
    echo ""
    print_message $BLUE "📋 管理命令:"
    echo "   查看日志: docker-compose logs -f"
    echo "   停止服务: docker-compose down"
    echo "   重启服务: docker-compose restart"
    echo "   查看状态: docker-compose ps"
    echo ""
    print_message $BLUE "📁 数据持久化:"
    echo "   浏览器会话数据保存在 Docker volume 中"
    echo "   日志文件保存在 ./logs 目录中"
}

# 清理函数
cleanup() {
    print_message $BLUE "🧹 清理 Docker 资源..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose down
    else
        docker compose down
    fi
    
    # 清理未使用的镜像
    docker image prune -f
    
    print_message $GREEN "✅ 清理完成"
}

# 显示帮助信息
show_help() {
    echo "环境管理器 Docker 部署脚本"
    echo ""
    echo "使用方法:"
    echo "  ./deploy.sh [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -c, --cleanup  清理 Docker 资源"
    echo "  -b, --build    仅构建镜像"
    echo "  -s, --start    仅启动服务"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh           # 完整部署"
    echo "  ./deploy.sh --build   # 仅构建镜像"
    echo "  ./deploy.sh --cleanup # 清理资源"
}

# 主函数
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--cleanup)
            cleanup
            exit 0
            ;;
        -b|--build)
            check_requirements
            build_image
            exit 0
            ;;
        -s|--start)
            start_services
            check_health
            show_info
            exit 0
            ;;
        "")
            # 完整部署流程
            check_requirements
            build_image
            start_services
            check_health
            show_info
            ;;
        *)
            print_message $RED "❌ 未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
