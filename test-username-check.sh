#!/bin/bash

echo "🧪 Testing Username Checking API..."
echo ""

BASE_URL="http://localhost:5001"

# Test cases
declare -a usernames=("validuser123" "test_user" "a" "thisusernameiswaywaytoolong" "invalid-chars!" "normaluser")

for username in "${usernames[@]}"; do
    echo "Testing username: $username"
    response=$(curl -s -w "Response time: %{time_total}s" "$BASE_URL/api/auth/check-username/$username")
    echo "$response"
    echo "---"
done

echo "✨ Username checking test completed!"
