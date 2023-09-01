const types = [
  'feat', // 代表提交的文件为新增功能
  'fix', // 代表提交的文件为修复bug
  'docs', // 只改动了文档相关的内容
  'style', // 不影响代码含义的改动，例如去掉空格、改变缩进、增删分号
  'build', // 编译相关的修改，例如发布版本、对项目构建或者依赖的改动
  'revert' // 执行git revert打印的message
]

module.exports = {
  rules: {
    'commit-rule': [2, 'always']
  },
  plugins: [
    {
      rules: {
        'commit-rule': ({ raw }) => {
          return [
            /^\[(feat|fix|docs|style|build|revert)].+/g.test(raw),
            `commit备注信息格式错误，格式为 <[type] 修改内容>，type支持${types.join(',')}`
          ]
        }
      }
    }
  ]
}