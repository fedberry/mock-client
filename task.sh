#!/bin/sh

# This is basic prototype.

TASK_URL="http://mock.fedberry.org/mock_cluster/task"
mac=`cat /sys/class/net/usb0/address`
secret=`cat mock-client.config|grep secret|awk -F= '{print$2}'`
name=`cat mock-client.config|grep name|awk -F= '{print$2}'`

result=`curl -s $TASK_URL -X GET -H "Accept: application/json" -H "MAC:$mac"`
url=`echo $result|grep URL|awk -F= '{print$2}'`

cd /home/build/srpms
wget $url

rpmname=`basename $url`

su -l build -c 'mock -r '$name' -n --rebuild ~/srpms/'$rpmname' '
