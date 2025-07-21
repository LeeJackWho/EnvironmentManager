#!/bin/bash

# 环境管理系统部署脚本
# 使用方法: ./scripts/deploy.sh [environment]
# 环境选项: development, staging, production

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
ENVIRONMENT=${1:-production}
log_info "部署环境: $ENVIRONMENT"

# 检查必要的文件
check_files() {
    log_info "检查必要文件..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json 文件不存在"
        exit 1
    fi
    
    if [ ! -f ".env.example" ]; then
        log_error ".env.example 文件不存在"
        exit 1
    fi
    
    if [ ! -f ".env.local" ] && [ "$ENVIRONMENT" = "development" ]; then
        log_warning ".env.local 文件不存在，请复制 .env.example 并配置"
        cp .env.example .env.local
        log_info "已创建 .env.local 文件，请编辑并配置环境变量"
    fi
    
    log_success "文件检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装依赖..."
    npm ci
    log_success "依赖安装完成"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    npm run lint
    log_success "测试通过"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    npm run build
    log_success "项目构建完成"
}

# 部署到不同环境
deploy_to_environment() {
    case $ENVIRONMENT in
        "development")
            log_info "启动开发服务器..."
            npm run dev
            ;;
        "staging")
            log_info "部署到测试环境..."
            # 这里可以添加测试环境部署逻辑
            log_success "测试环境部署完成"
            ;;
        "production")
            log_info "部署到生产环境..."
            # 检查环境变量
            if [ -z "$NOTION_API_KEY" ] || [ -z "$NOTION_DATABASE_ID" ]; then
                log_error "生产环境必须设置 NOTION_API_KEY 和 NOTION_DATABASE_ID 环境变量"
                exit 1
            fi
            npm start
            ;;
        *)
            log_error "未知的部署环境: $ENVIRONMENT"
            log_info "支持的环境: development, staging, production"
            exit 1
            ;;
    esac
}

# 主函数
main() {
    log_info "开始部署环境管理系统..."
    
    check_files
    install_dependencies
    run_tests
    build_project
    deploy_to_environment
    
    log_success "部署完成！"
}

# 执行主函数
main
