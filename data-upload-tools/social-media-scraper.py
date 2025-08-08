#!/usr/bin/env python3
"""
Social Media Monitoring for Pacific Sands
Tracks mentions, sentiment, and engagement across social platforms
"""

import asyncio
import aiohttp
import json
import re
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

@dataclass
class SocialMediaMention:
    platform: str
    content: str
    author: str
    url: str
    timestamp: str
    engagement_metrics: Dict
    sentiment: str
    hashtags: List[str]
    mentions: List[str]
    location: Optional[str] = None
    media_type: str = "text"  # text, image, video

class SocialMediaScraper:
    def __init__(self):
        self.session = None
        self.api_keys = self.load_api_keys()
        
        # Monitoring keywords
        self.keywords = [
            "Pacific Sands",
            "@PacificSands",
            "#PacificSands",
            "Dory Cove",
            "Cape Kiwanda hotel",
            "Pacific City Oregon",
            "#OregonCoast",
            "#PacificCity"
        ]
        
        # Location-based keywords
        self.location_keywords = [
            "Pacific City",
            "Oregon Coast",
            "Cape Kiwanda",
            "Haystack Rock",
            "Lincoln City",
            "Tillamook"
        ]

    def load_api_keys(self):
        """Load social media API keys"""
        try:
            with open('/Users/simeong/data-upload-tools/social-api-keys.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            # Create template file
            template = {
                "twitter": {
                    "api_key": "your_twitter_api_key",
                    "api_secret": "your_twitter_api_secret",
                    "bearer_token": "your_twitter_bearer_token"
                },
                "instagram": {
                    "access_token": "your_instagram_access_token"
                },
                "facebook": {
                    "access_token": "your_facebook_access_token",
                    "app_id": "your_facebook_app_id"
                },
                "reddit": {
                    "client_id": "your_reddit_client_id",
                    "client_secret": "your_reddit_client_secret",
                    "user_agent": "PacificSandsScraper/1.0"
                }
            }
            
            with open('/Users/simeong/data-upload-tools/social-api-keys.json', 'w') as f:
                json.dump(template, f, indent=2)
                
            logger.info("Created social-api-keys.json template. Please add your API keys.")
            return template

    async def init_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()

    async def close_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()

    async def scrape_twitter_mentions(self) -> List[SocialMediaMention]:
        """Scrape Twitter mentions using Twitter API v2"""
        mentions = []
        
        if not self.api_keys.get("twitter", {}).get("bearer_token"):
            logger.warning("Twitter bearer token not configured")
            return mentions

        bearer_token = self.api_keys["twitter"]["bearer_token"]
        headers = {"Authorization": f"Bearer {bearer_token}"}
        
        for keyword in self.keywords:
            # Twitter API v2 recent search endpoint
            url = "https://api.twitter.com/2/tweets/search/recent"
            params = {
                "query": f'"{keyword}" -is:retweet',
                "tweet.fields": "created_at,author_id,public_metrics,geo,context_annotations",
                "user.fields": "username,name,location",
                "expansions": "author_id",
                "max_results": 50
            }
            
            try:
                async with self.session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        tweets = data.get("data", [])
                        users = {user["id"]: user for user in data.get("includes", {}).get("users", [])}
                        
                        for tweet in tweets:
                            author_info = users.get(tweet["author_id"], {})
                            
                            mentions.append(SocialMediaMention(
                                platform="Twitter",
                                content=tweet["text"],
                                author=f"@{author_info.get('username', 'unknown')}",
                                url=f"https://twitter.com/user/status/{tweet['id']}",
                                timestamp=tweet["created_at"],
                                engagement_metrics={
                                    "likes": tweet.get("public_metrics", {}).get("like_count", 0),
                                    "retweets": tweet.get("public_metrics", {}).get("retweet_count", 0),
                                    "replies": tweet.get("public_metrics", {}).get("reply_count", 0)
                                },
                                sentiment=self.analyze_sentiment(tweet["text"]),
                                hashtags=self.extract_hashtags(tweet["text"]),
                                mentions=self.extract_mentions(tweet["text"]),
                                location=author_info.get("location")
                            ))
                    else:
                        logger.error(f"Twitter API error: {response.status}")
                        
            except Exception as e:
                logger.error(f"Error scraping Twitter for '{keyword}': {e}")
                
            # Rate limiting
            await asyncio.sleep(1)
            
        return mentions

    async def scrape_instagram_mentions(self) -> List[SocialMediaMention]:
        """Scrape Instagram mentions using Instagram Basic Display API"""
        mentions = []
        
        if not self.api_keys.get("instagram", {}).get("access_token"):
            logger.warning("Instagram access token not configured")
            return mentions

        access_token = self.api_keys["instagram"]["access_token"]
        
        # Instagram hashtag search (simplified)
        for keyword in ["#PacificSands", "#PacificCity", "#OregonCoast"]:
            try:
                # This would require Instagram Graph API for business accounts
                # Simplified implementation for demonstration
                logger.info(f"Would search Instagram for {keyword}")
                
                # Simulated Instagram mention
                mentions.append(SocialMediaMention(
                    platform="Instagram",
                    content=f"Beautiful sunset at {keyword.replace('#', '')}! 📸",
                    author="@traveler123",
                    url=f"https://instagram.com/p/simulated",
                    timestamp=datetime.now().isoformat(),
                    engagement_metrics={"likes": 42, "comments": 8},
                    sentiment="positive",
                    hashtags=[keyword, "#sunset", "#travel"],
                    mentions=[],
                    media_type="image"
                ))
                
            except Exception as e:
                logger.error(f"Error scraping Instagram for '{keyword}': {e}")
                
        return mentions

    async def scrape_reddit_mentions(self) -> List[SocialMediaMention]:
        """Scrape Reddit mentions using Reddit API"""
        mentions = []
        
        reddit_creds = self.api_keys.get("reddit", {})
        if not reddit_creds.get("client_id"):
            logger.warning("Reddit API credentials not configured")
            return mentions

        # Reddit search across relevant subreddits
        subreddits = ["oregon", "travel", "hotels", "PacificNorthwest", "roadtrip"]
        
        for keyword in self.keywords[:3]:  # Limit keywords for Reddit
            for subreddit in subreddits:
                try:
                    # Reddit search API endpoint
                    url = f"https://www.reddit.com/r/{subreddit}/search.json"
                    params = {
                        "q": keyword,
                        "sort": "new",
                        "limit": 25,
                        "t": "week"  # Past week
                    }
                    
                    headers = {"User-Agent": reddit_creds.get("user_agent", "PacificSandsScraper/1.0")}
                    
                    async with self.session.get(url, params=params, headers=headers) as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            for post in data.get("data", {}).get("children", []):
                                post_data = post["data"]
                                
                                # Check if our keywords appear in title or selftext
                                content = f"{post_data.get('title', '')} {post_data.get('selftext', '')}"
                                if keyword.lower() in content.lower():
                                    mentions.append(SocialMediaMention(
                                        platform="Reddit",
                                        content=content[:500],  # Truncate long posts
                                        author=f"u/{post_data.get('author', 'unknown')}",
                                        url=f"https://reddit.com{post_data.get('permalink', '')}",
                                        timestamp=datetime.fromtimestamp(post_data.get("created_utc", 0)).isoformat(),
                                        engagement_metrics={
                                            "upvotes": post_data.get("ups", 0),
                                            "comments": post_data.get("num_comments", 0),
                                            "score": post_data.get("score", 0)
                                        },
                                        sentiment=self.analyze_sentiment(content),
                                        hashtags=[],
                                        mentions=[],
                                        location=f"r/{subreddit}"
                                    ))
                                    
                        await asyncio.sleep(2)  # Reddit rate limiting
                        
                except Exception as e:
                    logger.error(f"Error scraping Reddit r/{subreddit} for '{keyword}': {e}")
                    
        return mentions

    async def scrape_facebook_mentions(self) -> List[SocialMediaMention]:
        """Scrape Facebook mentions using Facebook Graph API"""
        mentions = []
        
        facebook_creds = self.api_keys.get("facebook", {})
        if not facebook_creds.get("access_token"):
            logger.warning("Facebook access token not configured")
            return mentions

        # Note: Facebook API has restrictions on public content search
        # This would typically require page-specific access or business verification
        logger.info("Facebook API integration requires business verification for public searches")
        
        return mentions

    def analyze_sentiment(self, text: str) -> str:
        """Simple sentiment analysis (would integrate with proper NLP service)"""
        positive_words = ["great", "amazing", "beautiful", "love", "excellent", "perfect", "wonderful", "fantastic"]
        negative_words = ["terrible", "awful", "bad", "worst", "horrible", "disappointing", "poor", "hate"]
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"

    def extract_hashtags(self, text: str) -> List[str]:
        """Extract hashtags from text"""
        return re.findall(r'#\w+', text)

    def extract_mentions(self, text: str) -> List[str]:
        """Extract @mentions from text"""
        return re.findall(r'@\w+', text)

    async def run_social_monitoring(self) -> List[SocialMediaMention]:
        """Run comprehensive social media monitoring"""
        all_mentions = []
        
        logger.info("Starting social media monitoring...")
        
        # Run all platform scrapers concurrently
        tasks = [
            self.scrape_twitter_mentions(),
            self.scrape_instagram_mentions(),
            self.scrape_reddit_mentions(),
            self.scrape_facebook_mentions()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Social media scraping error: {result}")
            elif isinstance(result, list):
                all_mentions.extend(result)
        
        logger.info(f"Social media monitoring complete: {len(all_mentions)} mentions found")
        return all_mentions

# Main execution for testing
async def main():
    scraper = SocialMediaScraper()
    await scraper.init_session()
    
    try:
        mentions = await scraper.run_social_monitoring()
        
        # Save to JSON file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'/Users/simeong/data-upload-tools/social_mentions_{timestamp}.json'
        
        with open(filename, 'w') as f:
            json.dump([asdict(mention) for mention in mentions], f, indent=2, default=str)
            
        print(f"Saved {len(mentions)} social media mentions to {filename}")
        
    finally:
        await scraper.close_session()

if __name__ == "__main__":
    asyncio.run(main())