#!/bin/bash

# 环境管理系统快速设置脚本
# 使用方法: ./scripts/setup.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 显示欢迎信息
show_welcome() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    环境管理系统                              ║"
    echo "║              Environment Manager Setup                       ║"
    echo "║                                                              ║"
    echo "║  基于 Next.js 和 Notion 的自动化登录管理系统                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查系统要求
check_requirements() {
    log_step "检查系统要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18 或更高版本"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js 版本过低，需要 18 或更高版本，当前版本: $(node -v)"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    log_success "系统要求检查通过 - Node.js $(node -v), npm $(npm -v)"
}

# 安装依赖
install_dependencies() {
    log_step "安装项目依赖..."
    npm install
    log_success "依赖安装完成"
}

# 设置环境变量
setup_environment() {
    log_step "设置环境变量..."
    
    if [ ! -f ".env.local" ]; then
        cp .env.example .env.local
        log_success "已创建 .env.local 文件"
        
        echo -e "${YELLOW}"
        echo "┌─────────────────────────────────────────────────────────────┐"
        echo "│                      重要提醒                               │"
        echo "├─────────────────────────────────────────────────────────────┤"
        echo "│ 请编辑 .env.local 文件，配置以下环境变量：                  │"
        echo "│                                                             │"
        echo "│ 1. NOTION_API_KEY - Notion 集成 API 密钥                   │"
        echo "│ 2. NOTION_DATABASE_ID - Notion 数据库 ID                   │"
        echo "│ 3. CAPTCHA_API_KEY - 验证码识别服务密钥（可选）             │"
        echo "│                                                             │"
        echo "│ 详细配置步骤请查看: NOTION_SETUP.md                        │"
        echo "└─────────────────────────────────────────────────────────────┘"
        echo -e "${NC}"
        
        read -p "按回车键继续..."
    else
        log_info ".env.local 文件已存在"
    fi
}

# 验证配置
validate_config() {
    log_step "验证配置..."
    
    if [ -f ".env.local" ]; then
        source .env.local
        
        if [ -z "$NOTION_API_KEY" ] || [ "$NOTION_API_KEY" = "your_notion_api_key_here" ]; then
            log_warning "NOTION_API_KEY 未配置或使用默认值"
        else
            log_success "NOTION_API_KEY 已配置"
        fi
        
        if [ -z "$NOTION_DATABASE_ID" ] || [ "$NOTION_DATABASE_ID" = "your_database_id_here" ]; then
            log_warning "NOTION_DATABASE_ID 未配置或使用默认值"
        else
            log_success "NOTION_DATABASE_ID 已配置"
        fi
    fi
}

# 构建项目
build_project() {
    log_step "构建项目..."
    npm run build
    log_success "项目构建完成"
}

# 显示下一步操作
show_next_steps() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    设置完成！                                ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  下一步操作：                                                ║"
    echo "║                                                              ║"
    echo "║  1. 配置 Notion API（如果还未配置）                          ║"
    echo "║     查看: NOTION_SETUP.md                                    ║"
    echo "║                                                              ║"
    echo "║  2. 启动开发服务器                                           ║"
    echo "║     npm run dev                                              ║"
    echo "║                                                              ║"
    echo "║  3. 访问应用                                                 ║"
    echo "║     http://localhost:3000                                    ║"
    echo "║                                                              ║"
    echo "║  4. 部署到生产环境                                           ║"
    echo "║     查看 README.md 中的部署指南                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 主函数
main() {
    show_welcome
    check_requirements
    install_dependencies
    setup_environment
    validate_config
    build_project
    show_next_steps
}

# 执行主函数
main
