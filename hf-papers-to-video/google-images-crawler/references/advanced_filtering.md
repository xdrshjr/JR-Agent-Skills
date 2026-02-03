# Advanced Filtering Options

## Size Filtering

Add size parameters to Google Images URL:

```python
# Large images only
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=isz:l"

# Medium images
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=isz:m"

# Icon sized
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=isz:i"
```

Size codes:
- `isz:l` - Large
- `isz:m` - Medium  
- `isz:i` - Icon
- `isz:lt,islt:2mp` - Larger than 2MP
- `isz:lt,islt:4mp` - Larger than 4MP
- `isz:lt,islt:8mp` - Larger than 8MP
- `isz:lt,islt:10mp` - Larger than 10MP
- `isz:lt,islt:12mp` - Larger than 12MP
- `isz:lt,islt:15mp` - Larger than 15MP
- `isz:lt,islt:20mp` - Larger than 20MP
- `isz:lt,islt:40mp` - Larger than 40MP
- `isz:lt,islt:70mp` - Larger than 70MP

## Type Filtering

```python
# Face photos
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=itp:face"

# Photos only
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=itp:photo"

# Clip art
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=itp:clipart"

# Line drawings
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=itp:lineart"

# Animated GIFs
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=itp:animated"
```

## Color Filtering

```python
# Full color (default)
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ic:color"

# Black and white
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ic:gray"

# Transparent background
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ic:trans"

# Specific colors
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ic:specific,isc:red"
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ic:specific,isc:blue"
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ic:specific,isc:green"
```

Color codes: `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `white`, `gray`, `black`, `brown`

## Usage Filtering

```python
# Creative Commons licenses
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=il:cl"

# Commercial reuse allowed
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=il:cl&hl=en"

# Modification allowed
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=sur:fm"
```

## Time Filtering

```python
# Past 24 hours
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=qdr:d"

# Past week
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=qdr:w"

# Past month
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=qdr:m"

# Past year
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=qdr:y"
```

## Format Filtering

```python
# JPEG only
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ift:jpg"

# PNG only
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ift:png"

# GIF only
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ift:gif"

# BMP only
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ift:bmp"

# SVG only
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ift:svg"

# WebP only
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=ift:webp"
```

## Combining Filters

Multiple filters can be combined with commas:

```python
# Large, full color photos from past month
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=isz:l,ic:color,itp:photo,qdr:m"

# Large PNG images
url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=isz:l,ift:png"
```
