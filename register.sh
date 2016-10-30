#!/bin/sh

# This is basic prototype.

arch=`arch`
secret=`date|md5sum |awk '{print$1}'`
mac=`cat /sys/class/net/usb0/address`

echo '{"MAC":"'$mac'", "secret": "'$secret'", "arch": "'$arch'"}'
result=`curl -s http://mock.fedberry.org/mock_cluster/register -X POST -H "Accept: application/json" -d '{"MAC":"'$mac'", "secret": "'$secret'", "arch": "'$arch'"}'`


echo $result
if [ "$result" != "Agent registered." ]; then
  echo "Not registered"
else
  echo "Time to save $secret"
fi
