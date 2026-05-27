#!/bin/bash

# Color codes for pretty printing
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Workspace root (dynamically resolved)
WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"


# Port definitions
FRONT_PORT=3000
BACK_PORT=8000

# Action and Target
ACTION=$1
TARGET=$2

# Validate action
if [[ -z "$ACTION" || ! "$ACTION" =~ ^(start|stop|status|restart)$ ]]; then
  echo -e "${RED}사용법: $0 {start|stop|status|restart} [frontend|backend]${NC}"
  exit 1
fi

# Determine targets
RUN_FRONT=false
RUN_BACK=false

if [[ -z "$TARGET" ]]; then
  RUN_FRONT=true
  RUN_BACK=true
elif [[ "$TARGET" == "frontend" ]]; then
  RUN_FRONT=true
elif [[ "$TARGET" == "backend" ]]; then
  RUN_BACK=true
else
  echo -e "${RED}올바르지 않은 대상입니다: $TARGET (frontend 또는 backend 지정 가능, 생략 시 둘 다)${NC}"
  exit 1
fi

# Detect package runner (prefer bun, fallback to npm)
if command -v bun >/dev/null 2>&1; then
  RUNNER="bun"
else
  RUNNER="npm"
fi

# Detect OS type (Windows/Git Bash vs Unix)
IS_WINDOWS=false
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || -n "$COMSPEC" ]]; then
  IS_WINDOWS=true
fi

get_pid() {
  local port=$1
  if [ "$IS_WINDOWS" = true ]; then
    netstat -ano | grep "LISTENING" | grep ":$port " | awk '{print $5}' | sort -u | tr '\n' ' ' | sed 's/ $//'
  else
    lsof -t -i :"$port" 2>/dev/null | sort -u | tr '\n' ' ' | sed 's/ $//'
  fi
}

is_running() {
  local port=$1
  if [ "$IS_WINDOWS" = true ]; then
    netstat -ano | grep "LISTENING" | grep ":$port " >/dev/null 2>&1
  else
    lsof -i :"$port" -sTCP:LISTEN >/dev/null 2>&1
  fi
}


# --- Action Implementations ---

start_target() {
  local name=$1
  local port=$2
  local dir=$3
  local cmd=$4
  local log_file=$5

  echo -e "${BLUE}=== ${name} (Port: ${port}) 시작 중... ===${NC}"

  if is_running "$port"; then
    local pid
    pid=$(get_pid "$port")
    echo -e "${YELLOW}⚠️ 경고: ${name}의 포트 ${port}이(가) 이미 사용 중입니다. (PID: ${pid})${NC}"
    
    # Prompt the user for confirmation (Korean default)
    read -r -p "해당 프로세스(PID: ${pid})를 종료(kill)하고 새로 실행하시겠습니까? (y/N): " answer < /dev/tty
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}프로세스 ${pid} 종료 중...${NC}"
      kill -9 "$pid" 2>/dev/null
      sleep 1.5
    else
      echo -e "${RED}실행을 취소했습니다.${NC}"
      return 1
    fi
  fi

  echo -e "${GREEN}${name} 실행 중... (로그: ${log_file})${NC}"
  cd "$WORKSPACE_DIR/$dir" || exit 1
  
  # Run background process
  nohup $cmd > "$WORKSPACE_DIR/$log_file" 2>&1 &
  
  # Wait briefly to check if it started successfully
  sleep 2
  if is_running "$port"; then
    local new_pid
    new_pid=$(get_pid "$port")
    echo -e "${GREEN}✓ ${name}가 성공적으로 시작되었습니다. (PID: ${new_pid})${NC}"
  else
    echo -e "${RED}✗ ${name} 시작에 실패했습니다. 로그(${log_file})를 확인해 주세요.${NC}"
  fi
  cd "$WORKSPACE_DIR" || exit 1
}

stop_target() {
  local name=$1
  local port=$2

  echo -e "${BLUE}=== ${name} (Port: ${port}) 중지 중... ===${NC}"
  if is_running "$port"; then
    local pid
    pid=$(get_pid "$port")
    echo -e "${YELLOW}프로세스 ${pid} 종료 중...${NC}"
    kill "$pid" 2>/dev/null
    sleep 1.5
    
    # Double check and force kill if still running
    if is_running "$port"; then
      echo -e "${YELLOW}정상 종료되지 않아 강제 종료(kill -9)를 시도합니다...${NC}"
      kill -9 "$pid" 2>/dev/null
      sleep 1
    fi

    if is_running "$port"; then
      echo -e "${RED}✗ ${name} 종료에 실패했습니다. 수동으로 프로세스(PID: ${pid})를 확인해 주세요.${NC}"
    else
      echo -e "${GREEN}✓ ${name}가 성공적으로 중지되었습니다.${NC}"
    fi
  else
    echo -e "${YELLOW}${name} (Port: ${port})는 현재 실행 중이 아닙니다.${NC}"
  fi
}

status_target() {
  local name=$1
  local port=$2

  if is_running "$port"; then
    local pid
    pid=$(get_pid "$port")
    echo -e "${GREEN}● ${name} (Port: ${port}) is running (PID: ${pid})${NC}"
  else
    echo -e "${RED}○ ${name} (Port: ${port}) is stopped${NC}"
  fi
}

# Run Action
case "$ACTION" in
  start)
    if [ "$RUN_FRONT" = true ]; then
      start_target "Frontend" "$FRONT_PORT" "standalone" "$RUNNER run dev" "frontend.log"
    fi
    if [ "$RUN_BACK" = true ]; then
      start_target "Backend" "$BACK_PORT" "standalone/server" "$RUNNER run start" "backend.log"
    fi
    ;;
  stop)
    if [ "$RUN_FRONT" = true ]; then
      stop_target "Frontend" "$FRONT_PORT"
    fi
    if [ "$RUN_BACK" = true ]; then
      stop_target "Backend" "$BACK_PORT"
    fi
    ;;
  status)
    if [ "$RUN_FRONT" = true ]; then
      status_target "Frontend" "$FRONT_PORT"
    fi
    if [ "$RUN_BACK" = true ]; then
      status_target "Backend" "$BACK_PORT"
    fi
    ;;
  restart)
    # Stop targets first
    if [ "$RUN_FRONT" = true ]; then
      stop_target "Frontend" "$FRONT_PORT"
    fi
    if [ "$RUN_BACK" = true ]; then
      stop_target "Backend" "$BACK_PORT"
    fi
    
    echo -e "\n${BLUE}잠시 후 서비스를 재시작합니다...${NC}\n"
    sleep 1

    # Start targets
    if [ "$RUN_FRONT" = true ]; then
      start_target "Frontend" "$FRONT_PORT" "standalone" "$RUNNER run dev" "frontend.log"
    fi
    if [ "$RUN_BACK" = true ]; then
      start_target "Backend" "$BACK_PORT" "standalone/server" "$RUNNER run start" "backend.log"
    fi
    ;;
esac
