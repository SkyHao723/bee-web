// 扫码绑定按钮操作
function handleScanBind() {
  const qrCode = prompt("请输入二维码数据：")
  if (qrCode) {
    loading.value = true
    verifyQrCode(qrCode).then(response => {
      console.log("Response:", response)
      loading.value = false

      // 成功时打开添加弹窗
      if (response.code === 200 && response.data && response.data.equipmentId) {
        reset()
        scannedPower.value = qrCode
        form.value.power = qrCode

        if (response.data.apiaryId) {
          form.value.apiaryId = response.data.apiaryId
        }

        listApiary().then(res => {
          apiaryOptions.value = res.rows

          nextTick(() => {
            open.value = true
            title.value = "绑定蜂箱"
            console.log("弹窗已打开:", open.value)
          })
        })
      } else {
        proxy.$modal.msgError(response.msg || "暂无")
      }
    }).catch(() => {
      loading.value = false
      proxy.$modal.msgError("验证失败")
    })
  }
}

getList()
listApiary().then(res => {
  apiaryOptions.value = res.rows
})
</script>