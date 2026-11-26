// Cấu hình dayjs dùng cho hiển thị thời gian (tiếng Việt, "3 giờ trước").
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export default dayjs;
