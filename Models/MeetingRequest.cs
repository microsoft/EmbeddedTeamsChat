namespace EmbeddedChat.Models
{
    using Newtonsoft.Json;
	public class MeetingRequest
	{
        [JsonProperty("meetingOwnerId")]
        public string MeetingOwnerId { get; set; }

        public ThreadInfo ThreadInfo { get; set; }
    }
}