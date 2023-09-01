import Loger from '../common/loger';
import Service from '../service';
export default class TestConf {
  init() {
    Loger.info('点击测试url连接');
    Service.testConnect();
  }
}
