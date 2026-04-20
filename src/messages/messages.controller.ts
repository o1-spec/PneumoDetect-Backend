import { Body, Controller, Post, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a contact us message to support' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {

    const userId = req?.user?.id ?? null;
    return this.messagesService.sendMessage(userId, dto);
  }
}
