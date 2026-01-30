# Doubao Open TTS

Text-to-Speech (TTS) service using Doubao (Volcano Engine) API V1 interface to convert text into natural-sounding speech.

## Features

- 🎙️ **200+ Voice Options** - Default: Shiny (灿灿) for general scenarios
- 🔊 **Multiple Audio Formats** - Supports mp3, pcm, wav
- ⚡ **Adjustable Parameters** - Speed and volume control
- 📦 **Dual Interface** - Command-line tool + Python API
- 🎯 **Voice Categorization** - Browse voices by category

## Installation

```bash
cd skills/volcano-tts
pip install -r requirements.txt
```

## Configuration

### Method 1: Environment Variables

```bash
export VOLCANO_TTS_APPID="your_app_id"
export VOLCANO_TTS_ACCESS_TOKEN="your_access_token"
export VOLCANO_TTS_SECRET_KEY="your_secret_key"
export VOLCANO_TTS_VOICE_TYPE="zh_female_cancan_mars_bigtts"  # Optional: set default voice
```

### Method 2: .env File

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
# Edit the .env file with your credentials
```

## Usage

### Command Line

```bash
# Basic usage (uses default voice: Shiny)
python scripts/tts.py "Hello, this is a test of Doubao text-to-speech service"

# Specify output file and format
python scripts/tts.py "Welcome to use TTS" -o output.mp3 -e mp3

# Read text from file
python scripts/tts.py -f input.txt -o output.mp3

# Adjust parameters
python scripts/tts.py "Custom voice" --speed 1.2 --volume 0.8 -v zh_female_cancan_mars_bigtts

# List all available voices
python scripts/tts.py --list-voices

# List voices by category
python scripts/tts.py --list-voices --category "General-Multilingual"

# Use different cluster
python scripts/tts.py "Hello" --cluster volcano_tts

# Enable debug mode
python scripts/tts.py "Test" --debug
```

### Python API

```python
from scripts.tts import VolcanoTTS, VOICE_TYPES, VOICE_CATEGORIES

# Initialize client
tts = VolcanoTTS(
    app_id="your_app_id",
    access_token="your_access_token",
    secret_key="your_secret_key",
    voice_type="zh_female_cancan_mars_bigtts"  # Optional: set default voice
)

# List available voices
print("All voices:", tts.list_voices())
print("General voices:", tts.list_voices("General-Normal"))

# Change voice
tts.set_voice("zh_male_xudong_conversation_wvae_bigtts")  # Set to "Happy Xiaodong"

# Synthesize speech
output_path = tts.synthesize(
    text="Hello, this is Doubao text-to-speech",
    voice_type="zh_female_cancan_mars_bigtts",  # Optional: override default
    encoding="mp3",
    cluster="volcano_tts",
    speed=1.0,
    volume=1.0,
    output_file="output.mp3"
)

print(f"Audio saved to: {output_path}")
```

## Interactive Voice Selection

The SKILL supports interactive voice selection workflow for Agent-User collaboration:

### Workflow

1. **Agent Prompts User** - Agent asks user to select a voice
2. **Display Voice Options** - Show recommended voices by category
3. **User Selection** - User tells Agent their preferred voice
4. **Agent Calls Skill** - Agent uses the selected voice to generate audio

### Python API for Interactive Selection

```python
from scripts.tts import (
    get_voice_selection_prompt,
    find_voice_by_name,
    get_voice_info,
    VolcanoTTS
)

# Step 1: Get the selection prompt to show user
prompt = get_voice_selection_prompt()
print(prompt)
# Agent displays this to user and waits for response

# Step 2: User responds with their choice (e.g., "Shiny" or "灿灿")
user_input = "Shiny"  # This comes from user

# Step 3: Find the voice_type from user input
voice_type, voice_name = find_voice_by_name(user_input)
if voice_type:
    print(f"Selected voice: {voice_name} ({voice_type})")
    
    # Get detailed info
    info = get_voice_info(voice_type)
    print(f"Category: {info['category_display']}")
    
    # Step 4: Use the voice to synthesize
    tts = VolcanoTTS(
        app_id="your_app_id",
        access_token="your_access_token",
        secret_key="your_secret_key"
    )
    
    output_path = tts.synthesize(
        text="Hello, this is the selected voice",
        voice_type=voice_type,
        output_file="output.mp3"
    )
    print(f"Audio saved to: {output_path}")
else:
    print("Voice not found, using default")
```

### Example Agent-User Conversation

```
Agent: 🎙️ Please select a voice for text-to-speech synthesis:

Here are our recommended voices by category:

[General - Normal]
  • 灿灿/Shiny [DEFAULT] (Chinese) -> voice_type: zh_female_cancan_mars_bigtts
  • 快乐小东 (Chinese) -> voice_type: zh_male_xudong_conversation_wvae_bigtts
  • 亲切女声 (Chinese) -> voice_type: zh_female_qinqienvsheng_moon_bigtts

[Roleplay]
  • 纯真少女 (Chinese) -> voice_type: ICL_zh_female_chunzhenshaonv_e588402fb8ad_tob
  • 霸道总裁 (Chinese) -> voice_type: ICL_zh_male_badaozongcai_v1_tob
  • 撒娇男友 (Chinese) -> voice_type: ICL_zh_male_sajiaonanyou_tob

[Video Dubbing]
  • 猴哥 (Chinese) -> voice_type: zh_male_sunwukong_mars_bigtts
  • 熊二 (Chinese) -> voice_type: zh_male_xionger_mars_bigtts
  • 佩奇猪 (Chinese) -> voice_type: zh_female_peiqi_mars_bigtts

💡 Tips:
  • You can say the voice name (e.g., 'Shiny', '猴哥', '霸道总裁')
  • Or provide the voice_type directly
  • Type 'list all' to see all 200+ available voices
  • Press Enter to use the default voice (Shiny)

Which voice would you like to use?

User: I want to use 猴哥

Agent: [Calls skill with voice_type="zh_male_sunwukong_mars_bigtts"]
       ✅ Generated audio with voice: 猴哥
```

### Supported Input Formats

The `find_voice_by_name()` function supports:
- **Direct voice_type**: `zh_female_cancan_mars_bigtts`
- **Chinese name**: `灿灿`, `猴哥`, `霸道总裁`
- **English alias**: `Shiny`, `Skye`, `Alvin`
- **Partial match**: `灿灿` matches `灿灿/Shiny`

## Parameters

| Parameter | Description | Default | Options |
|-----------|-------------|---------|---------|
| voice_type | Voice type | zh_female_cancan_mars_bigtts | See voice list below |
| encoding | Audio format | mp3 | mp3, pcm, wav |
| sample_rate | Sample rate | 24000 | 8000, 16000, 24000 |
| speed | Speech speed | 1.0 | 0.5 - 2.0 |
| volume | Volume level | 1.0 | 0.5 - 2.0 |
| cluster | Cluster name | volcano_tts | volcano_tts |

## Voice Categories

### General - Multilingual (with emotion support)

Supported emotions: happy, sad, angry, surprised, fear, hate, excited, coldness, neutral, depressed, lovey-dovey, shy, comfort, tension, tender, storytelling, radio, magnetic, advertising, vocal-fry, ASMR, news, entertainment, dialect

| voice_type | Voice Name | Language |
|------------|------------|----------|
| zh_male_lengkugege_emo_v2_mars_bigtts | Cold Brother (Emotion) | Chinese |
| zh_female_tianxinxiaomei_emo_v2_mars_bigtts | Sweet Xiaomei (Emotion) | Chinese |
| zh_female_gaolengyujie_emo_v2_mars_bigtts | Cold Lady (Emotion) | Chinese |
| zh_male_aojiaobazong_emo_v2_mars_bigtts | Proud CEO (Emotion) | Chinese |
| zh_male_guangzhoudege_emo_mars_bigtts | Guangzhou Brother (Emotion) | Chinese |
| zh_male_jingqiangkanye_emo_mars_bigtts | Beijing Style (Emotion) | Chinese |
| zh_female_linjuayi_emo_v2_mars_bigtts | Neighbor Aunt (Emotion) | Chinese |
| zh_male_yourougongzi_emo_v2_mars_bigtts | Gentleman (Emotion) | Chinese |
| zh_male_ruyayichen_emo_v2_mars_bigtts | Elegant Boyfriend (Emotion) | Chinese |
| zh_male_junlangnanyou_emo_v2_mars_bigtts | Handsome Boyfriend (Emotion) | Chinese |
| zh_male_beijingxiaoye_emo_v2_mars_bigtts | Beijing Guy (Emotion) | Chinese |
| zh_female_roumeinvyou_emo_v2_mars_bigtts | Gentle Girlfriend (Emotion) | Chinese |
| zh_male_yangguangqingnian_emo_v2_mars_bigtts | Sunshine Youth (Emotion) | Chinese |
| zh_female_meilinvyou_emo_v2_mars_bigtts | Charming Girlfriend (Emotion) | Chinese |
| zh_female_shuangkuaisisi_emo_v2_mars_bigtts | Cheerful Sisi (Emotion) | Chinese/American English |
| en_female_candice_emo_v2_mars_bigtts | Candice (Emotion) | American English |
| en_female_skye_emo_v2_mars_bigtts | Serena (Emotion) | American English |
| en_male_glen_emo_v2_mars_bigtts | Glen (Emotion) | American English |
| en_male_sylus_emo_v2_mars_bigtts | Sylus (Emotion) | American English |
| en_male_corey_emo_v2_mars_bigtts | Corey (Emotion) | British English |
| en_female_nadia_tips_emo_v2_mars_bigtts | Nadia (Emotion) | British English |
| zh_male_shenyeboke_emo_v2_mars_bigtts | Late Night Podcast (Emotion) | Chinese |

### General - Normal

| voice_type | Voice Name | Language |
|------------|------------|----------|
| **zh_female_cancan_mars_bigtts** | **Shiny (灿灿)** ⭐Default | **Chinese/American English** |
| zh_female_qinqienvsheng_moon_bigtts | Friendly Female | Chinese |
| zh_male_xudong_conversation_wvae_bigtts | Happy Xiaodong | Chinese |
| zh_female_shuangkuaisisi_moon_bigtts | Cheerful Sisi/Skye | Chinese/American English |
| zh_male_wennuanahu_moon_bigtts | Warm Ahu/Alvin | Chinese/American English |
| zh_male_yangguangqingnian_moon_bigtts | Sunshine Youth | Chinese |
| zh_female_linjianvhai_moon_bigtts | Girl Next Door | Chinese |
| zh_male_yuanboxiaoshu_moon_bigtts | Knowledgeable Uncle | Chinese |
| zh_female_gaolengyujie_moon_bigtts | Cold Lady | Chinese |
| zh_male_aojiaobazong_moon_bigtts | Proud CEO | Chinese |
| zh_female_meilinvyou_moon_bigtts | Charming Girlfriend | Chinese |
| zh_male_shenyeboke_moon_bigtts | Late Night Podcast | Chinese |
| zh_male_dongfanghaoran_moon_bigtts | Oriental Haoran | Chinese |

### Roleplay

| voice_type | Voice Name | Language |
|------------|------------|----------|
| ICL_zh_female_chunzhenshaonv_e588402fb8ad_tob | Innocent Girl | Chinese |
| ICL_zh_male_xiaonaigou_edf58cf28b8b_tob | Cute Boy | Chinese |
| ICL_zh_female_jinglingxiangdao_1beb294a9e3e_tob | Elf Guide | Chinese |
| ICL_zh_male_menyoupingxiaoge_ffed9fc2fee7_tob | Silent Guy | Chinese |
| ICL_zh_male_anrenqinzhu_cd62e63dcdab_tob | Dark Lord | Chinese |
| ICL_zh_male_badaozongcai_v1_tob | Dominant CEO | Chinese |
| ICL_zh_male_bingruogongzi_tob | Sickly Gentleman | Chinese |
| ICL_zh_female_bingjiao3_tob | Evil Queen | Chinese |
| ICL_zh_male_shuanglangshaonian_tob | Cheerful Youth | Chinese |
| ICL_zh_male_sajiaonanyou_tob | Clingy Boyfriend | Chinese |
| ICL_zh_male_wenrounanyou_tob | Gentle Boyfriend | Chinese |
| ICL_zh_male_tiancaitongzhuo_tob | Genius Deskmate | Chinese |
| ICL_zh_male_bingjiaoshaonian_tob | Yandere Youth | Chinese |
| ICL_zh_male_bingjiaonanyou_tob | Yandere Boyfriend | Chinese |
| ICL_zh_male_bingruoshaonian_tob | Sickly Youth | Chinese |
| ICL_zh_male_bingjiaogege_tob | Yandere Brother | Chinese |
| ICL_zh_female_bingjiaojiejie_tob | Yandere Sister | Chinese |
| ICL_zh_male_bingjiaodidi_tob | Yandere Brother (Young) | Chinese |
| ICL_zh_female_bingruoshaonv_tob | Sickly Girl | Chinese |
| ICL_zh_female_bingjiaomengmei_tob | Yandere Cute Girl | Chinese |
| ICL_zh_male_bingjiaobailian_tob | Yandere White Lotus | Chinese |

### Video Dubbing

| voice_type | Voice Name | Language |
|------------|------------|----------|
| zh_male_M100_conversation_wvae_bigtts | Gentleman | Chinese |
| zh_female_maomao_conversation_wvae_bigtts | Quiet Maomao | Chinese |
| zh_male_tiancaitongsheng_mars_bigtts | Child Prodigy | Chinese |
| zh_male_sunwukong_mars_bigtts | Monkey King | Chinese |
| zh_male_xionger_mars_bigtts | Bear Two | Chinese |
| zh_female_peiqi_mars_bigtts | Peppa Pig | Chinese |
| zh_female_wuzetian_mars_bigtts | Empress Wu | Chinese |
| zh_female_yingtaowanzi_mars_bigtts | Cherry Maruko | Chinese |
| zh_male_silang_mars_bigtts | Silang | Chinese |
| zh_male_jieshuonansheng_mars_bigtts | Narrator/Morgan | Chinese/American English |

### Audiobook

| voice_type | Voice Name | Language |
|------------|------------|----------|
| zh_male_changtianyi_mars_bigtts | Mystery Narrator | Chinese |
| zh_male_ruyaqingnian_mars_bigtts | Elegant Youth | Chinese |
| zh_male_baqiqingshu_mars_bigtts | Dominant Uncle | Chinese |
| zh_male_qingcang_mars_bigtts | Qingcang | Chinese |
| zh_female_gufengshaoyu_mars_bigtts | Ancient Style Lady | Chinese |
| zh_female_wenroushunv_mars_bigtts | Gentle Lady | Chinese |

### Multilingual

| voice_type | Voice Name | Language |
|------------|------------|----------|
| en_female_lauren_moon_bigtts | Lauren | American English |
| en_male_michael_moon_bigtts | Michael | American English |
| en_male_bruce_moon_bigtts | Bruce | American English |
| en_female_emily_mars_bigtts | Emily | British English |
| en_male_smith_mars_bigtts | Smith | British English |
| en_female_anna_mars_bigtts | Anna | British English |

### IP Voices

| voice_type | Voice Name | Language |
|------------|------------|----------|
| zh_male_hupunan_mars_bigtts | Shanghai Male | Chinese |
| zh_male_lubanqihao_mars_bigtts | Luban No.7 | Chinese |
| zh_female_yangmi_mars_bigtts | Lin Xiao | Chinese |
| zh_female_linzhiling_mars_bigtts | Sister Lingling | Chinese |
| zh_female_jiyejizi2_mars_bigtts | Kasukabe Sister | Chinese |
| zh_male_tangseng_mars_bigtts | Tang Monk | Chinese |
| zh_male_zhuangzhou_mars_bigtts | Zhuang Zhou | Chinese |
| zh_male_zhubajie_mars_bigtts | Zhu Bajie | Chinese |
| zh_female_ganmaodianyin_mars_bigtts | Sick Electronic Sister | Chinese |
| zh_female_naying_mars_bigtts | Frank Ying | Chinese |
| zh_female_leidian_mars_bigtts | Female Thor | Chinese |

### Fun Accents

| voice_type | Voice Name | Language |
|------------|------------|----------|
| zh_female_yueyunv_mars_bigtts | Cantonese Girl | Chinese |
| zh_male_yuzhouzixuan_moon_bigtts | Henan Boy | Chinese-Henan Accent |
| zh_female_daimengchuanmei_moon_bigtts | Sichuan Girl | Chinese-Sichuan Accent |
| zh_male_guangxiyuanzhou_moon_bigtts | Guangxi Boy | Chinese-Guangxi Accent |
| zh_male_zhoujielun_emo_v2_mars_bigtts | Nunchaku Guy | Chinese-Taiwan Accent |
| zh_female_wanwanxiaohe_moon_bigtts | Taiwan Xiaohe | Chinese-Taiwan Accent |
| zh_female_wanqudashu_moon_bigtts | Bay Area Uncle | Chinese-Guangdong Accent |
| zh_male_guozhoudege_moon_bigtts | Guangzhou Brother | Chinese-Guangdong Accent |
| zh_male_haoyuxiaoge_moon_bigtts | Qingdao Boy | Chinese-Qingdao Accent |
| zh_male_beijingxiaoye_moon_bigtts | Beijing Guy | Chinese-Beijing Accent |
| zh_male_jingqiangkanye_moon_bigtts | Beijing Style/Harmony | Chinese-Beijing/American English |
| zh_female_meituojieer_moon_bigtts | Changsha Girl | Chinese-Changsha Accent |

### Customer Service

| voice_type | Voice Name | Language |
|------------|------------|----------|
| ICL_zh_female_lixingyuanzi_cs_tob | Rational Yuanzi | Chinese |
| ICL_zh_female_qingtiantaotao_cs_tob | Sweet Taotao | Chinese |
| ICL_zh_female_qingxixiaoxue_cs_tob | Clear Xiaoxue | Chinese |
| ICL_zh_female_qingtianmeimei_cs_tob | Sweet Meimei | Chinese |
| ICL_zh_female_kailangtingting_cs_tob | Cheerful Tingting | Chinese |
| ICL_zh_male_qingxinmumu_cs_tob | Fresh Mumu | Chinese |
| ICL_zh_male_shuanglangxiaoyang_cs_tob | Cheerful Xiaoyang | Chinese |
| ICL_zh_male_qingxinbobo_cs_tob | Fresh Bobo | Chinese |
| ICL_zh_female_wenwanshanshan_cs_tob | Gentle Shanshan | Chinese |
| ICL_zh_female_tianmeixiaoyu_cs_tob | Sweet Xiaoyu | Chinese |
| ICL_zh_female_reqingaina_cs_tob | Enthusiastic Aina | Chinese |
| ICL_zh_female_tianmeixiaoju_cs_tob | Sweet Xiaoju | Chinese |
| ICL_zh_male_chenwenmingzai_cs_tob | Steady Mingzai | Chinese |
| ICL_zh_male_qinqiexiaozhuo_cs_tob | Friendly Xiaozhuo | Chinese |
| ICL_zh_female_lingdongxinxin_cs_tob | Lively Xinxin | Chinese |
| ICL_zh_female_guaiqiaokeer_cs_tob | Good Keer | Chinese |
| ICL_zh_female_nuanxinqianqian_cs_tob | Warm Qianqian | Chinese |
| ICL_zh_female_ruanmengtuanzi_cs_tob | Soft Tuanzi | Chinese |
| ICL_zh_male_yangguangyangyang_cs_tob | Sunny Yangyang | Chinese |
| ICL_zh_female_ruanmengtangtang_cs_tob | Soft Tangtang | Chinese |
| ICL_zh_female_xiuliqianqian_cs_tob | Beautiful Qianqian | Chinese |
| ICL_zh_female_kaixinxiaohong_cs_tob | Happy Xiaohong | Chinese |
| ICL_zh_female_qingyingduoduo_cs_tob | Light Duoduo | Chinese |
| zh_female_kefunvsheng_mars_bigtts | Warm Female | Chinese |

> **Tip**: Use `python scripts/tts.py --list-voices` to see the complete voice list

## Get API Credentials

1. Visit [Volcano Engine Console](https://console.volcengine.com/)
2. Enable "Doubao Voice" service
3. Create an application in the console to get AppID, Access Token, and Secret Key
4. **Ensure your account has sufficient TTS quota**

## Troubleshooting

### Error: "requested resource not granted"

**Cause**: Account lacks TTS service permission

**Solution**:
1. Login to [Volcano Engine Console](https://console.volcengine.com/)
2. Go to "Doubao Voice" product page
3. Confirm service is enabled and has available quota
4. Check if Token has TTS calling permission

### Error: "invalid auth token"

**Cause**: Authentication information error

**Solution**:
1. Check if AppID, Access Token, Secret Key are correct
2. Ensure no extra spaces

### Error: "requested resource not found"

**Cause**: Voice type or cluster name error

**Solution**:
1. Try different voice_type, such as BV001_streaming, BV002_streaming
2. Try different cluster, such as volcano_tts, volcano

### Test Configuration

Run test script to try multiple configurations:

```bash
python scripts/test_tts.py
```

## Notes

- Ensure your account has sufficient speech synthesis quota
- Text length limits refer to official documentation
- Network request timeout defaults to 30 seconds

---

## Author

**xdrshjr**

If you find this SKILL helpful, please give me a star on GitHub!

⭐ **Star me at**: [https://github.com/xdrshjr](https://github.com/xdrshjr)

Your support motivates me to create more useful SKILLS for the community!
