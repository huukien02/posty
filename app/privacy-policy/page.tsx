"use client";

import { Container, Typography, Box, Paper } from "@mui/material";

export default function PrivacyPolicyPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom>
          Chính sách quyền riêng tư
        </Typography>

        <Typography variant="body1" paragraph>
          Chúng tôi cam kết bảo vệ quyền riêng tư của bạn. Chính sách này giải
          thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của
          bạn khi sử dụng dịch vụ.
        </Typography>

        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            1. Thông tin chúng tôi thu thập
          </Typography>
          <Typography variant="body2" paragraph>
            Chúng tôi có thể thu thập các thông tin cơ bản như email, tên, hoặc
            dữ liệu cần thiết để cung cấp dịch vụ.
          </Typography>
        </Box>

        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            2. Cách chúng tôi sử dụng thông tin
          </Typography>
          <Typography variant="body2" paragraph>
            Thông tin được sử dụng để duy trì và cải thiện dịch vụ, cũng như đảm
            bảo trải nghiệm người dùng tốt nhất.
          </Typography>
        </Box>

        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            3. Bảo mật thông tin
          </Typography>
          <Typography variant="body2" paragraph>
            Chúng tôi áp dụng các biện pháp an ninh hợp lý để bảo vệ dữ liệu cá
            nhân của bạn.
          </Typography>
        </Box>

        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            4. Liên hệ
          </Typography>
          <Typography variant="body2">
            Nếu bạn có bất kỳ câu hỏi nào liên quan đến Chính sách quyền riêng
            tư, vui lòng liên hệ qua email:
            <strong> support@example.com</strong>.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
