#!/bin/bash

echo "📊 Log Analysis Report"
echo "====================="

LOG_FILE="logs/application.log"
REPORT_FILE="logs/analysis-report-$(date +%Y%m%d-%H%M%S).txt"

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if log file exists, if not try to get logs from Docker
if [ ! -f "$LOG_FILE" ]; then
    echo "📄 Log file not found at $LOG_FILE, attempting to get Docker logs..."
    docker-compose logs manager-product-service > "$LOG_FILE" 2>/dev/null
    
    if [ ! -s "$LOG_FILE" ]; then
        echo "❌ No logs available for analysis"
        exit 1
    fi
fi

# Analyze error patterns
echo "🔍 Error Analysis:" | tee "$REPORT_FILE"
echo "==================" | tee -a "$REPORT_FILE"

# Count error levels
error_count=$(grep -c "ERROR" "$LOG_FILE" 2>/dev/null || echo "0")
warn_count=$(grep -c "WARN" "$LOG_FILE" 2>/dev/null || echo "0")
info_count=$(grep -c "INFO" "$LOG_FILE" 2>/dev/null || echo "0")

echo "Error Count: $error_count" | tee -a "$REPORT_FILE"
echo "Warning Count: $warn_count" | tee -a "$REPORT_FILE"
echo "Info Count: $info_count" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Top error messages
echo "🔥 Top Error Messages:" | tee -a "$REPORT_FILE"
echo "=====================" | tee -a "$REPORT_FILE"
grep "ERROR" "$LOG_FILE" 2>/dev/null | cut -d']' -f3- | sort | uniq -c | sort -nr | head -10 | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Database connection issues
echo "🗄️ Database Issues:" | tee -a "$REPORT_FILE"
echo "==================" | tee -a "$REPORT_FILE"
grep -i "connection\|database\|sql" "$LOG_FILE" 2>/dev/null | grep -i "error\|exception" | tail -5 | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Performance issues
echo "⚡ Performance Issues:" | tee -a "$REPORT_FILE"
echo "=====================" | tee -a "$REPORT_FILE"
grep -i "timeout\|slow\|performance" "$LOG_FILE" 2>/dev/null | tail -5 | tee -a "$REPORT_FILE"

echo ""
echo "📄 Full report saved to: $REPORT_FILE"