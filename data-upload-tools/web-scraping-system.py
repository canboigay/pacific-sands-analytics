#!/usr/bin/env python3
"""
Pacific Sands Web Scraping System
Automated data collection for competitive intelligence
"""

import asyncio
import aiohttp
import json
import csv
import time
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional
import re
from bs4 import BeautifulSoup
import logging
from urllib.parse import urljoin, urlparse
import random

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class CompetitorRate:
    """Competitor pricing data structure"""
    competitor_name: str
    room_type: str
    rate: float
    date: str
    check_in: str
    check_out: str
    availability: bool
    source_url: str
    scraped_at: str
    currency: str = "USD"
    occupancy_status: Optional[str] = None
    special_offers: Optional[str] = None

@dataclass
class Mention:
    """Web mention data structure"""
    source: str
    content: str
    sentiment: str
    url: str
    date: str
    author: Optional[str] = None
    platform: str = ""
    engagement_metrics: Optional[Dict] = None

@dataclass
class Review:
    """Review data structure"""
    platform: str
    rating: float
    title: str
    content: str
    date: str
    reviewer_name: str
    url: str
    helpful_votes: int = 0
    verified: bool = False
    room_type: Optional[str] = None

class PacificSandsScraper:
    def __init__(self):
        self.session = None
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
        ]
        
        # Competitor hotels in the area
        self.competitors = {
            "Coastal Inn": {
                "booking_com": "coastal-inn-pacific-city",
                "expedia": "coastal-inn-pacific-city-hotel",
                "website": "https://coastalinnpacificcity.com"
            },
            "Seaside Resort": {
                "booking_com": "seaside-resort-pacific",
                "expedia": "seaside-resort-pacific-city",
                "website": "https://seasideresortpacific.com"
            },
            "Ocean View Lodge": {
                "booking_com": "ocean-view-lodge-pacific",
                "expedia": "ocean-view-lodge-pacific-city",
                "website": "https://oceanviewlodge.com"
            },
            "Beach Haven Inn": {
                "booking_com": "beach-haven-inn-pacific",
                "expedia": "beach-haven-inn-pacific-city",
                "website": "https://beachhaveninn.com"
            }
        }
        
        # Search terms for mentions monitoring
        self.mention_keywords = [
            "Pacific Sands",
            "Pacific City hotel",
            "Oregon coast lodging",
            "Dory Cove",
            "Cape Kiwanda"
        ]

    async def init_session(self):
        """Initialize aiohttp session with proper headers"""
        connector = aiohttp.TCPConnector(limit=10, limit_per_host=2)
        timeout = aiohttp.ClientTimeout(total=30)
        
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'User-Agent': random.choice(self.user_agents)}
        )

    async def close_session(self):
        """Close the aiohttp session"""
        if self.session:
            await self.session.close()

    async def scrape_booking_com_rates(self, competitor_name: str, hotel_id: str) -> List[CompetitorRate]:
        """Scrape rates from Booking.com"""
        rates = []
        
        # Check rates for next 30 days
        for days_ahead in range(0, 30, 7):  # Weekly checks
            check_in = (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
            check_out = (datetime.now() + timedelta(days=days_ahead + 2)).strftime('%Y-%m-%d')
            
            url = f"https://www.booking.com/hotel/us/{hotel_id}.html"
            params = {
                'checkin': check_in,
                'checkout': check_out,
                'group_adults': 2,
                'group_children': 0,
                'no_rooms': 1
            }
            
            try:
                await asyncio.sleep(random.uniform(2, 5))  # Rate limiting
                
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Parse room rates (simplified - would need more specific selectors)
                        room_elements = soup.find_all(['div', 'span'], class_=re.compile(r'room|price'))
                        
                        for element in room_elements:
                            price_text = element.get_text(strip=True)
                            if '$' in price_text and any(char.isdigit() for char in price_text):
                                # Extract price
                                price_match = re.search(r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)', price_text)
                                if price_match:
                                    rate = float(price_match.group(1).replace(',', ''))
                                    
                                    rates.append(CompetitorRate(
                                        competitor_name=competitor_name,
                                        room_type="Standard",  # Would need to parse actual room type
                                        rate=rate,
                                        date=datetime.now().strftime('%Y-%m-%d'),
                                        check_in=check_in,
                                        check_out=check_out,
                                        availability=True,
                                        source_url=str(response.url),
                                        scraped_at=datetime.now().isoformat(),
                                        currency="USD"
                                    ))
                                    break  # Take first price found
                        
            except Exception as e:
                logger.error(f"Error scraping Booking.com for {competitor_name}: {e}")
                
        return rates

    async def scrape_tripadvisor_reviews(self, competitor_name: str) -> List[Review]:
        """Scrape reviews from TripAdvisor"""
        reviews = []
        
        # Construct TripAdvisor URL (simplified)
        search_url = f"https://www.tripadvisor.com/Search?q={competitor_name.replace(' ', '+')}"
        
        try:
            await asyncio.sleep(random.uniform(3, 6))
            
            async with self.session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Find review elements (would need specific selectors for TripAdvisor)
                    review_elements = soup.find_all(['div'], class_=re.compile(r'review'))
                    
                    for element in review_elements[:5]:  # Limit to 5 reviews per scrape
                        try:
                            rating_elem = element.find(['span', 'div'], class_=re.compile(r'rating|star'))
                            content_elem = element.find(['p', 'div'], class_=re.compile(r'content|text'))
                            date_elem = element.find(['span', 'div'], class_=re.compile(r'date'))
                            
                            if rating_elem and content_elem:
                                # Extract rating (simplified)
                                rating_text = rating_elem.get_text(strip=True)
                                rating_match = re.search(r'(\d+(?:\.\d+)?)', rating_text)
                                rating = float(rating_match.group(1)) if rating_match else 3.0
                                
                                reviews.append(Review(
                                    platform="TripAdvisor",
                                    rating=rating,
                                    title="Review",  # Would extract actual title
                                    content=content_elem.get_text(strip=True)[:500],
                                    date=datetime.now().strftime('%Y-%m-%d'),  # Would parse actual date
                                    reviewer_name="Anonymous",  # Would extract actual name
                                    url=str(response.url)
                                ))
                        except Exception as e:
                            logger.warning(f"Error parsing review element: {e}")
                            
        except Exception as e:
            logger.error(f"Error scraping TripAdvisor reviews for {competitor_name}: {e}")
            
        return reviews

    async def scrape_google_mentions(self, keyword: str) -> List[Mention]:
        """Search for mentions using Google (simplified approach)"""
        mentions = []
        
        # Use Google search API or scrape search results
        # Note: This is simplified - would need proper Google API integration
        search_query = f'"{keyword}" hotel review OR mention'
        
        try:
            # Simulated mention data - would integrate with actual Google API
            mentions.append(Mention(
                source="Google Search",
                content=f"Recent mention of {keyword} found in search results",
                sentiment="neutral",
                url=f"https://google.com/search?q={keyword.replace(' ', '+')}",
                date=datetime.now().strftime('%Y-%m-%d'),
                platform="web"
            ))
        except Exception as e:
            logger.error(f"Error searching Google mentions for {keyword}: {e}")
            
        return mentions

    async def scrape_competitor_website(self, competitor_name: str, website_url: str) -> List[CompetitorRate]:
        """Scrape rates directly from competitor websites"""
        rates = []
        
        try:
            await asyncio.sleep(random.uniform(2, 4))
            
            async with self.session.get(website_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Look for pricing information
                    price_elements = soup.find_all(text=re.compile(r'\$\d+'))
                    
                    for price_text in price_elements[:3]:  # Take first 3 prices found
                        price_match = re.search(r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)', str(price_text))
                        if price_match:
                            rate = float(price_match.group(1).replace(',', ''))
                            
                            if 50 <= rate <= 1000:  # Reasonable hotel rate range
                                rates.append(CompetitorRate(
                                    competitor_name=competitor_name,
                                    room_type="Unknown",
                                    rate=rate,
                                    date=datetime.now().strftime('%Y-%m-%d'),
                                    check_in=(datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
                                    check_out=(datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d'),
                                    availability=True,
                                    source_url=website_url,
                                    scraped_at=datetime.now().isoformat()
                                ))
                                
        except Exception as e:
            logger.error(f"Error scraping {competitor_name} website: {e}")
            
        return rates

    async def run_competitor_pricing_scrape(self) -> List[CompetitorRate]:
        """Run comprehensive competitor pricing scrape"""
        all_rates = []
        
        logger.info("Starting competitor pricing scrape...")
        
        for competitor_name, sources in self.competitors.items():
            logger.info(f"Scraping {competitor_name}...")
            
            # Scrape Booking.com
            if 'booking_com' in sources:
                booking_rates = await self.scrape_booking_com_rates(competitor_name, sources['booking_com'])
                all_rates.extend(booking_rates)
            
            # Scrape competitor website
            if 'website' in sources:
                website_rates = await self.scrape_competitor_website(competitor_name, sources['website'])
                all_rates.extend(website_rates)
                
            # Add delay between competitors
            await asyncio.sleep(random.uniform(5, 10))
            
        logger.info(f"Collected {len(all_rates)} competitor rates")
        return all_rates

    async def run_mentions_monitoring(self) -> List[Mention]:
        """Monitor web mentions of Pacific Sands and related terms"""
        all_mentions = []
        
        logger.info("Starting mentions monitoring...")
        
        for keyword in self.mention_keywords:
            mentions = await self.scrape_google_mentions(keyword)
            all_mentions.extend(mentions)
            await asyncio.sleep(random.uniform(2, 4))
            
        logger.info(f"Collected {len(all_mentions)} mentions")
        return all_mentions

    async def run_reviews_scrape(self) -> List[Review]:
        """Scrape competitor reviews"""
        all_reviews = []
        
        logger.info("Starting reviews scrape...")
        
        for competitor_name in self.competitors.keys():
            reviews = await self.scrape_tripadvisor_reviews(competitor_name)
            all_reviews.extend(reviews)
            await asyncio.sleep(random.uniform(3, 7))
            
        logger.info(f"Collected {len(all_reviews)} reviews")
        return all_reviews

    async def save_data_to_mcp(self, rates: List[CompetitorRate], mentions: List[Mention], reviews: List[Review]):
        """Save scraped data to MCP system"""
        
        # Save competitor rates
        if rates:
            rates_data = [asdict(rate) for rate in rates]
            await self.post_to_mcp('/data/upload', {
                'data_type': 'competitors',
                'data': rates_data,
                'source': 'web_scraper',
                'scraped_at': datetime.now().isoformat()
            })
            
        # Save mentions
        if mentions:
            mentions_data = [asdict(mention) for mention in mentions]
            await self.post_to_mcp('/data/upload', {
                'data_type': 'mentions',
                'data': mentions_data,
                'source': 'web_scraper',
                'scraped_at': datetime.now().isoformat()
            })
            
        # Save reviews
        if reviews:
            reviews_data = [asdict(review) for review in reviews]
            await self.post_to_mcp('/data/upload', {
                'data_type': 'reviews',
                'data': reviews_data,
                'source': 'web_scraper',
                'scraped_at': datetime.now().isoformat()
            })

    async def post_to_mcp(self, endpoint: str, data: Dict):
        """Post data to MCP system"""
        mcp_base_url = "https://your-mcp-domain.com/api"  # Update with actual URL
        api_key = "ps_me2w0k3e_x81fsv0yz3k"  # Your API key
        
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        try:
            async with self.session.post(
                f"{mcp_base_url}{endpoint}", 
                json=data, 
                headers=headers
            ) as response:
                if response.status == 200:
                    logger.info(f"Successfully uploaded {len(data.get('data', []))} records to MCP")
                else:
                    logger.error(f"Failed to upload to MCP: {response.status}")
                    
        except Exception as e:
            logger.error(f"Error posting to MCP: {e}")

    def save_to_csv(self, rates: List[CompetitorRate], mentions: List[Mention], reviews: List[Review]):
        """Save data to CSV files as backup"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save rates
        if rates:
            with open(f'/Users/simeong/data-upload-tools/scraped_rates_{timestamp}.csv', 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=asdict(rates[0]).keys())
                writer.writeheader()
                for rate in rates:
                    writer.writerow(asdict(rate))
                    
        # Save mentions
        if mentions:
            with open(f'/Users/simeong/data-upload-tools/scraped_mentions_{timestamp}.csv', 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=asdict(mentions[0]).keys())
                writer.writeheader()
                for mention in mentions:
                    writer.writerow(asdict(mention))
                    
        # Save reviews
        if reviews:
            with open(f'/Users/simeong/data-upload-tools/scraped_reviews_{timestamp}.csv', 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=asdict(reviews[0]).keys())
                writer.writeheader()
                for review in reviews:
                    writer.writerow(asdict(review))

    async def run_full_scrape(self):
        """Run complete scraping operation"""
        await self.init_session()
        
        try:
            # Run all scraping operations concurrently
            rates_task = self.run_competitor_pricing_scrape()
            mentions_task = self.run_mentions_monitoring()
            reviews_task = self.run_reviews_scrape()
            
            rates, mentions, reviews = await asyncio.gather(
                rates_task, mentions_task, reviews_task, return_exceptions=True
            )
            
            # Handle any exceptions
            if isinstance(rates, Exception):
                logger.error(f"Error in rates scraping: {rates}")
                rates = []
            if isinstance(mentions, Exception):
                logger.error(f"Error in mentions scraping: {mentions}")
                mentions = []
            if isinstance(reviews, Exception):
                logger.error(f"Error in reviews scraping: {reviews}")
                reviews = []
            
            # Save data
            await self.save_data_to_mcp(rates, mentions, reviews)
            self.save_to_csv(rates, mentions, reviews)
            
            logger.info(f"Scraping complete: {len(rates)} rates, {len(mentions)} mentions, {len(reviews)} reviews")
            
        except Exception as e:
            logger.error(f"Error in full scrape: {e}")
        finally:
            await self.close_session()

# Main execution
async def main():
    scraper = PacificSandsScraper()
    await scraper.run_full_scrape()

if __name__ == "__main__":
    asyncio.run(main())